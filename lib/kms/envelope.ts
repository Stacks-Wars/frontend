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
const DEV_KEY_VERSION = "local:dev1"

let kmsClient: KeyManagementServiceClient | null = null

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

function encryptWithDevSecret(plaintext: string, secret: string) {
    const key = deriveDevKey(secret)
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", key, iv)
    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ])
    const tag = cipher.getAuthTag()
    const payload = Buffer.concat([iv, tag, encrypted]).toString("base64")
    return {
        ciphertext: `${DEV_CIPHER_PREFIX}${payload}`,
        kmsKeyVersion: DEV_KEY_VERSION,
    }
}

function decryptWithDevSecret(ciphertextBase64: string, secret: string) {
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

export async function encryptWithKms(plaintext: string) {
    const devSecret = getDevSecret()
    if (devSecret) {
        return encryptWithDevSecret(plaintext, devSecret)
    }

    requireKmsConfig()
    const { cryptoKeyName } = getKmsConfig()
    const [result] = await getKmsClient().encrypt({
        name: cryptoKeyName,
        plaintext: Buffer.from(plaintext, "utf8"),
    })

    if (!result.ciphertext) {
        throw new Error("KMS encryption did not return ciphertext.")
    }

    return {
        ciphertext: Buffer.from(result.ciphertext).toString("base64"),
        kmsKeyVersion: result.name ?? cryptoKeyName,
    }
}

/** Symmetric Cloud KMS ciphertext carries its own key version. Local blobs use `dev1:`. */
export async function decryptWithKms(ciphertextBase64: string) {
    if (ciphertextBase64.startsWith(DEV_CIPHER_PREFIX)) {
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
        return decryptWithDevSecret(ciphertextBase64, secret)
    }

    requireKmsConfig()
    const { cryptoKeyName } = getKmsConfig()
    const [result] = await getKmsClient().decrypt({
        name: cryptoKeyName,
        ciphertext: Buffer.from(ciphertextBase64, "base64"),
    })

    if (!result.plaintext) {
        throw new Error("KMS decryption did not return plaintext.")
    }

    return Buffer.from(result.plaintext).toString("utf8")
}
