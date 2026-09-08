export const CHAIN_IDS = ["solana", "stacks", "arbitrum", "botchain"] as const

export type ChainId = (typeof CHAIN_IDS)[number]

export const DEFAULT_CHAIN: ChainId = "solana"

export type ChainNetwork = string

export type ChainAdapter = {
    id: ChainId
    label: string
    playToken: string
    /** dest/test vs production cluster for this chain. */
    playNetwork: () => ChainNetwork
    parseAddress: (raw: string) => string | null
    explorerTxUrl: (txid: string, network: ChainNetwork) => string
    explorerAccountUrl: (address: string, network: ChainNetwork) => string
}

export function isChainId(value: string): value is ChainId {
    return (CHAIN_IDS as readonly string[]).includes(value)
}

/** Arbitrum and BOT Chain share one signing key per dest/prod cluster. */
export function isEvmChain(chain: ChainId): boolean {
    switch (chain) {
        case "arbitrum":
        case "botchain":
            return true
        case "solana":
        case "stacks":
            return false
    }
}

export function parseChainId(value: string | null | undefined): ChainId {
    if (value && isChainId(value)) return value
    if (value?.trim().toLowerCase() === "bot") return "botchain"
    return DEFAULT_CHAIN
}

/** `0x` EOAs first so they are not mistaken for Solana pubkeys. Ambiguous EVM stays Arbitrum. */
export function inferChainFromAddress(address: string): ChainId | null {
    const value = address.trim()
    if (/^0x[0-9a-fA-F]{40}$/.test(value)) return "arbitrum"
    if (
        (value.startsWith("SP") || value.startsWith("ST")) &&
        value.length >= 39 &&
        /^[0-9A-Z]+$/.test(value)
    ) {
        return "stacks"
    }
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(value)) {
        return "solana"
    }
    return null
}

/**
 * Free lobbies never sign a wallet tx, so they are visible on every chain.
 * Paid and sponsored lobbies stay on the chain that holds the vault seat.
 */
export function lobbyVisibleOnChain(
    lobby: { chain?: string | null; entryAmountMicro: number },
    current: ChainId
): boolean {
    if (lobby.entryAmountMicro <= 0) return true
    return parseChainId(lobby.chain) === current
}
