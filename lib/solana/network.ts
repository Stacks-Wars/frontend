import {
    PLAY_CLAIM_MIN_MICRO,
    PLAY_MINT_MICRO,
    PLAY_TOKEN_DECIMALS,
} from "@/lib/chain/play"
import { solanaMint } from "@/lib/config"

export type SolanaNetworkName = "mainnet-beta" | "devnet"

export const SOLANA_USDC_DECIMALS = PLAY_TOKEN_DECIMALS
export const SOLANA_CLAIM_MIN_AMOUNT = PLAY_CLAIM_MIN_MICRO
export const SOLANA_TEST_USDC_AMOUNT = PLAY_MINT_MICRO

/** Dest and main share the play cluster until Solana mainnet ships. */
export function getSolanaNetworkName(): SolanaNetworkName {
    return "devnet"
}

export function getSolanaUsdcMint(): string {
    return solanaMint()
}
