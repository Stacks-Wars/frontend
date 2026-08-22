import "server-only"

import {
    createCipheriv,
    createDecipheriv,
    createHash,
    randomBytes,
} from "node:crypto"

import { KeyManagementServiceClient } from "@google-cloud/kms"

import { getKmsConfig } from "@/lib/kms/config"

/** Prefix marks AES-GCM blobs sealed with `CUSTODIAL_DEV_SECRET` (local only). */
const DEV_CIPHER_PREFIX = "dev1:"
/** Local wrap with AAD (mirrors Cloud KMS version 2). */
const DEV_KEY_V2 = "local:dev2"

let kmsClient: KeyManagementServiceClient | null = null

export type SealedMnemonic = {
    ciphertext: string
    kmsKeyVersion: string
}

/**
 * Cloud KMS version 1 (and `local:dev1`) has no AAD.
 * Version 2+ (and `local:dev2`) is bound to `wallet:{id}:stacks:{network}`.
 */
export function kmsWrapVersion(kmsKeyVersion: string): number {
    const gcp = kmsKeyVersion.match(/\/cryptoKeyVersions\/(\d+)$/)
    if (gcp) return Number(gcp[1])
    const local = kmsKeyVersion.match(/^local:dev(\d+)$/)
    if (local) return Number(local[1])
    return 1
}

export function usesMnemonicAad(kmsKeyVersion: string): boolean {
    return kmsWrapVersion(kmsKeyVersion) >= 2
}

export type DecryptOptions = {
    kmsKeyVersion: string
    /** Required for v2. Bind ciphertext to the wallet row. */
    aad?: string
}

function getDevSecret(): string | null {
    const secret = process.env.CUSTODIAL_DEV_SECRET?.trim()
    if (!secret) return null
    if (process.env.NODE_ENV === "production") {
        throw new Error(
            "CUSTODIAL_DEV_SECRET cannot be used in production. Configure Google Cloud KMS instead."
        )
    }
    if (secret.length < 16) {
        throw new Error(
            "CUSTODIAL_DEV_SECRET must be at least 16 characters. Generate with: openssl rand -base64 32"
        )
    }
    return secret
}

function deriveDevKey(secret: string): Buffer {
    return createHash("sha256").update(secret, "utf8").digest()
}

function aadBytes(aad: string | undefined): Buffer | undefined {
    if (!aad) return undefined
    return Buffer.from(aad, "utf8")
}

/** `wallet:{userId}:stacks:{network}` — a swapped ciphertext fails GCM. */
export function mnemonicAad(userId: string, network: string): string {
    return `wallet:${userId}:stacks:${network}`
}

function encryptWithDevSecret(
    plaintext: string,
    secret: string,
    aad: string
): SealedMnemonic {
    const key = deriveDevKey(secret)
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", key, iv)
    cipher.setAAD(aadBytes(aad)!)
    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ])
    const tag = cipher.getAuthTag()
    const payload = Buffer.concat([iv, tag, encrypted]).toString("base64")
    return {
        ciphertext: `${DEV_CIPHER_PREFIX}${payload}`,
        kmsKeyVersion: DEV_KEY_V2,
    }
}

function decryptWithDevSecret(
    ciphertextBase64: string,
    secret: string,
    aad?: string
) {
    const raw = ciphertextBase64.startsWith(DEV_CIPHER_PREFIX)
        ? ciphertextBase64.slice(DEV_CIPHER_PREFIX.length)
        : ciphertextBase64
    const buf = Buffer.from(raw, "base64")
    if (buf.length < 12 + 16 + 1) {
        throw new Error("Invalid CUSTODIAL_DEV_SECRET ciphertext.")
    }
    const iv = buf.subarray(0, 12)
    const tag = buf.subarray(12, 28)
    const encrypted = buf.subarray(28)
    const decipher = createDecipheriv("aes-256-gcm", deriveDevKey(secret), iv)
    const extra = aadBytes(aad)
    if (extra) decipher.setAAD(extra)
    decipher.setAuthTag(tag)
    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString("utf8")
}

function getServiceAccountCredentials() {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim()
    if (!raw) {
        throw new Error(
            "GOOGLE_SERVICE_ACCOUNT_KEY is not set. Paste the full service-account JSON as a single-line string."
        )
    }

    try {
        return JSON.parse(raw) as Record<string, unknown>
    } catch {
        throw new Error(
            "GOOGLE_SERVICE_ACCOUNT_KEY must be valid JSON (paste the full service-account key as a single-line string)."
        )
    }
}

function requireKmsConfig() {
    if (
        !process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
        !process.env.KMS_KEY_RING?.trim() ||
        !process.env.KMS_CRYPTO_KEY?.trim() ||
        !process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim()
    ) {
        throw new Error(
            "Custodial wallet encryption is not configured. For local development set CUSTODIAL_DEV_SECRET (openssl rand -base64 32)."
        )
    }
}

function getKmsClient() {
    requireKmsConfig()
    if (!kmsClient) {
        const { projectId } = getKmsConfig()
        kmsClient = new KeyManagementServiceClient({
            projectId,
            credentials: getServiceAccountCredentials(),
        })
    }

    return kmsClient
}

function isLocalKeyVersion(kmsKeyVersion: string | undefined) {
    const raw = kmsKeyVersion ?? ""
    return !raw || raw.startsWith("local:")
}

function isGcpResourceName(name: string) {
    return name.startsWith("projects/")
}

/**
 * Cloud KMS Decrypt wants the CryptoKey, not a version. The stored
 * `kms_key_version` is usually `…/cryptoKeys/{key}/cryptoKeyVersions/N`
 * from Encrypt. Strip the version so rotation inside the same key still
 * works, and so pointing env at a *new* key still opens old rows.
 */
function decryptResourceName(kmsKeyVersion: string): string {
    if (isGcpResourceName(kmsKeyVersion)) {
        return kmsKeyVersion.replace(/\/cryptoKeyVersions\/[^/]+$/, "")
    }
    const { cryptoKeyName } = getKmsConfig()
    return cryptoKeyName
}

export async function encryptWithKms(
    plaintext: string,
    aad: string
): Promise<SealedMnemonic> {
    if (!aad.trim()) {
        throw new Error("AAD is required to seal a custodial mnemonic.")
    }
    const extra = aadBytes(aad)
    if (!extra) {
        throw new Error("AAD is required to seal a custodial mnemonic.")
    }

    const devSecret = getDevSecret()
    if (devSecret) {
        return encryptWithDevSecret(plaintext, devSecret, aad)
    }

    requireKmsConfig()
    const { cryptoKeyName } = getKmsConfig()
    const [result] = await getKmsClient().encrypt({
        name: cryptoKeyName,
        plaintext: Buffer.from(plaintext, "utf8"),
        additionalAuthenticatedData: extra,
    })

    if (!result.ciphertext) {
        throw new Error("KMS encryption did not return ciphertext.")
    }

    return {
        ciphertext: Buffer.from(result.ciphertext).toString("base64"),
        kmsKeyVersion: result.name ?? cryptoKeyName,
    }
}

/** v1 omits AAD. v2 must pass the same AAD used at seal time. */
export async function decryptWithKms(
    ciphertextBase64: string,
    options: DecryptOptions
) {
    const localBlob = ciphertextBase64.startsWith(DEV_CIPHER_PREFIX)
    if (localBlob || isLocalKeyVersion(options.kmsKeyVersion)) {
        const secret = process.env.CUSTODIAL_DEV_SECRET?.trim()
        if (!secret) {
            throw new Error(
                "This wallet was encrypted with CUSTODIAL_DEV_SECRET, but the secret is not set."
            )
        }
        if (process.env.NODE_ENV === "production") {
            throw new Error(
                "CUSTODIAL_DEV_SECRET cannot be used in production. Configure Google Cloud KMS instead."
            )
        }
        if (secret.length < 16) {
            throw new Error(
                "CUSTODIAL_DEV_SECRET must be at least 16 characters."
            )
        }
        return decryptWithDevSecret(ciphertextBase64, secret, options.aad)
    }

    requireKmsConfig()
    const extra = aadBytes(options.aad)
    const [result] = await getKmsClient().decrypt({
        name: decryptResourceName(options.kmsKeyVersion),
        ciphertext: Buffer.from(ciphertextBase64, "base64"),
        ...(extra ? { additionalAuthenticatedData: extra } : {}),
    })

    if (!result.plaintext) {
        throw new Error("KMS decryption did not return plaintext.")
    }

    return Buffer.from(result.plaintext).toString("utf8")
}
