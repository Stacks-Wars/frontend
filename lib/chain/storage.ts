import { parseChainId, type ChainId } from "@/lib/chain/types"

const KEY = "sw:current-chain"
export const CHAIN_COOKIE = "sw-current-chain"

export function readStoredChain(): ChainId {
    if (typeof window === "undefined") return parseChainId(null)
    try {
        return parseChainId(window.localStorage.getItem(KEY))
    } catch {
        return parseChainId(null)
    }
}

export function writeStoredChain(chain: ChainId) {
    if (typeof window === "undefined") return
    try {
        window.localStorage.setItem(KEY, chain)
        document.cookie = `${CHAIN_COOKIE}=${chain}; path=/; max-age=31536000; samesite=lax`
    } catch {
        // ignore quota / private mode
    }
}
