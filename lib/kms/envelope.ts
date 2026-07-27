import {
    createCipheriv,
    createDecipheriv,
    randomBytes,
    scryptSync,
} from "node:crypto"

import { KeyManagementServiceClient } from "@google-cloud/kms"

import { getKmsConfig } from "@/lib/kms/config"

const DEV_KEY_VERSION = "dev:local-aes-256-gcm"

let kmsClient: KeyManagementServiceClient | null = null

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

function getKmsClient() {
    if (!kmsClient) {
        const { projectId } = getKmsConfig()
        kmsClient = new KeyManagementServiceClient({
            projectId,
            credentials: getServiceAccountCredentials(),
        })
    }

    return kmsClient
}

function hasKmsConfig() {
    return Boolean(
        process.env.GOOGLE_CLOUD_PROJECT &&
        process.env.KMS_KEY_RING &&
        process.env.KMS_CRYPTO_KEY &&
        process.env.GOOGLE_SERVICE_ACCOUNT_KEY
    )
}

function getDevSecretKey() {
    const secret = process.env.CUSTODIAL_DEV_SECRET?.trim()
    if (!secret || secret.length < 32) {
        throw new Error(
            "Set Google Cloud KMS env vars, or CUSTODIAL_DEV_SECRET (min 32 chars) for local development."
        )
    }

    return scryptSync(secret, "stacks-wars-custodial", 32)
}

function encryptWithDevSecret(plaintext: string) {
    const key = getDevSecretKey()
    const iv = randomBytes(12)
    const cipher = createCipheriv("aes-256-gcm", key, iv)
    const encrypted = Buffer.concat([
        cipher.update(plaintext, "utf8"),
        cipher.final(),
    ])
    const tag = cipher.getAuthTag()

    return {
        ciphertext: Buffer.concat([iv, tag, encrypted]).toString("base64"),
        kmsKeyVersion: DEV_KEY_VERSION,
    }
}

function decryptWithDevSecret(ciphertextBase64: string) {
    const key = getDevSecretKey()
    const payload = Buffer.from(ciphertextBase64, "base64")
    const iv = payload.subarray(0, 12)
    const tag = payload.subarray(12, 28)
    const encrypted = payload.subarray(28)
    const decipher = createDecipheriv("aes-256-gcm", key, iv)
    decipher.setAuthTag(tag)

    return Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
    ]).toString("utf8")
}

export async function encryptWithKms(plaintext: string) {
    if (!hasKmsConfig()) {
        return encryptWithDevSecret(plaintext)
    }

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

export async function decryptWithKms(
    ciphertextBase64: string,
    kmsKeyVersion?: string
) {
    if (!hasKmsConfig() || kmsKeyVersion === DEV_KEY_VERSION) {
        return decryptWithDevSecret(ciphertextBase64)
    }

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
