import "server-only"

import type { LocalAccount } from "viem/accounts"

import { arbitrumKey } from "@/lib/config"
import { deriveArbitrumAccountFromMnemonic } from "@/lib/arbitrum/wallet-from-mnemonic"

let cached: LocalAccount | null = null

/**
 * Platform gas payer + vault `msg.sender`. Dest uses the play mnemonic;
 * main uses ARBITRUM_KEY. Players never need Sepolia ETH.
 */
export function getArbitrumFeePayer(): LocalAccount {
    if (!cached) {
        cached = deriveArbitrumAccountFromMnemonic(arbitrumKey())
    }
    return cached
}
