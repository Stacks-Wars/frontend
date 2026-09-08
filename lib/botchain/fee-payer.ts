import "server-only"

import type { LocalAccount } from "viem/accounts"

import { evmKey } from "@/lib/config"
import { deriveBotchainAccountFromMnemonic } from "@/lib/botchain/wallet-from-mnemonic"

let cached: LocalAccount | null = null

/**
 * Platform gas payer + vault `msg.sender`. Dest uses the shared play
 * mnemonic; main uses EVM_KEY. Players never need BOT on dest.
 */
export function getBotchainFeePayer(): LocalAccount {
    if (!cached) {
        cached = deriveBotchainAccountFromMnemonic(evmKey())
    }
    return cached
}
