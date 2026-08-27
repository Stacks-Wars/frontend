export const CHAIN_IDS = ["solana", "stacks"] as const

export type ChainId = (typeof CHAIN_IDS)[number]

export const DEFAULT_CHAIN: ChainId = "solana"

export type ChainNetwork = string

export type ChainAddress = {
    chain: ChainId
    value: string
}

export type ChainAdapter = {
    id: ChainId
    label: string
    playToken: string
    parseAddress: (raw: string) => string | null
    explorerTxUrl: (txid: string, network: ChainNetwork) => string
    explorerAccountUrl: (address: string, network: ChainNetwork) => string
}

export function isChainId(value: string): value is ChainId {
    return (CHAIN_IDS as readonly string[]).includes(value)
}

export function parseChainId(value: string | null | undefined): ChainId {
    if (value && isChainId(value)) return value
    return DEFAULT_CHAIN
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
