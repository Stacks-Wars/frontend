import { KeyManagementServiceClient } from "@google-cloud/kms"

import { getKmsConfig } from "@/lib/kms/config"

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

function requireKmsConfig() {
    if (
        !process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
        !process.env.KMS_KEY_RING?.trim() ||
        !process.env.KMS_CRYPTO_KEY?.trim() ||
        !process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.trim()
    ) {
        throw new Error(
            "Google Cloud KMS is required for custodial wallets. Set GOOGLE_CLOUD_PROJECT, KMS_KEY_RING, KMS_CRYPTO_KEY, and GOOGLE_SERVICE_ACCOUNT_KEY."
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

/** Symmetric Cloud KMS ciphertext carries its own key version. */
export async function decryptWithKms(ciphertextBase64: string) {
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
