const PROJECT_ID = "stacks-wars"
const LOCATION = "global"
const KEY_RING = "stacks-wars-keyring"
const CRYPTO_KEY = "custodial-wallet-keys"

export function getKmsConfig() {
    return {
        projectId: PROJECT_ID,
        location: LOCATION,
        keyRing: KEY_RING,
        cryptoKey: CRYPTO_KEY,
        cryptoKeyName: `projects/${PROJECT_ID}/locations/${LOCATION}/keyRings/${KEY_RING}/cryptoKeys/${CRYPTO_KEY}`,
    }
}
