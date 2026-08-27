export type SolanaNetworkName = "mainnet-beta" | "devnet" | "testnet"

/** Platform-owned 6-decimal USDC on devnet. Mint authority is SOLANA_WARS_KEY. */
export const SOLANA_TEST_USDC_MINT =
    "2ztYALhLWs2Lg1bGRBje82RgiLhuH4ZbCimRWVeyxUaB"

export const SOLANA_USDC_DECIMALS = 6

/** $1 in base units. Claim dialog / remint only below this. */
export const SOLANA_CLAIM_MIN_AMOUNT = BigInt(1_000_000)

/** $50 in base units (6 decimals). */
export const SOLANA_TEST_USDC_AMOUNT = BigInt(50_000_000)

export function getSolanaNetworkName(): SolanaNetworkName {
    const raw = process.env.SOLANA_NETWORK?.trim().toLowerCase()
    if (raw === "mainnet" || raw === "mainnet-beta") return "mainnet-beta"
    if (raw === "testnet") return "testnet"
    return "devnet"
}

export function getSolanaRpcUrl(): string {
    const explicit = process.env.SOLANA_RPC_URL?.trim()
    if (explicit) return explicit
    switch (getSolanaNetworkName()) {
        case "mainnet-beta":
            return "https://api.mainnet-beta.solana.com"
        case "testnet":
            return "https://api.testnet.solana.com"
        default:
            return "https://api.devnet.solana.com"
    }
}

/** True on devnet/testnet. Never mint test USDC on mainnet. */
export function isSolanaTestUsdcEnabled(): boolean {
    return getSolanaNetworkName() !== "mainnet-beta"
}

/**
 * Play mint for vault + balances.
 * Devnet defaults to our test USDC. Mainnet defaults to Circle.
 * Override with SOLANA_USDC_MINT.
 */
export function getSolanaUsdcMint(): string {
    const explicit = process.env.SOLANA_USDC_MINT?.trim()
    if (explicit) return explicit
    if (getSolanaNetworkName() === "mainnet-beta") {
        return "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
    }
    return SOLANA_TEST_USDC_MINT
}
