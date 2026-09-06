import { isDev } from "@/lib/config"
import type { ChainId } from "@/lib/chain/types"

export const PLAY_TOKEN_DECIMALS = 6
export const PLAY_CLAIM_MIN_MICRO = BigInt(1_000_000)
export const PLAY_MINT_MICRO = BigInt(50_000_000)

/** Dest fixtures, or a play cluster that is still live in main (Solana Devnet). */
export function mintsPlayTokens(chain: ChainId): boolean {
    switch (chain) {
        case "solana":
            return true
        case "stacks":
            return isDev()
    }
}
