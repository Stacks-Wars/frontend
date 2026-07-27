export function getKmsConfig() {
    const projectId = process.env.GOOGLE_CLOUD_PROJECT
    const location = process.env.KMS_LOCATION ?? "global"
    const keyRing = process.env.KMS_KEY_RING
    const cryptoKey = process.env.KMS_CRYPTO_KEY

    if (!projectId || !keyRing || !cryptoKey) {
        throw new Error(
            "Google Cloud KMS is not configured. Set GOOGLE_CLOUD_PROJECT, KMS_KEY_RING, and KMS_CRYPTO_KEY."
        )
    }

    const cryptoKeyName = `projects/${projectId}/locations/${location}/keyRings/${keyRing}/cryptoKeys/${cryptoKey}`

    return {
        projectId,
        location,
        keyRing,
        cryptoKey,
        cryptoKeyName,
    }
}
