"use client"

import { ensureChainWallet } from "@/actions/chain"
import { claimTestUsdcOnchain } from "@/lib/onchain"
import type { ChainId } from "@/lib/chain"
import type { WalletBalance } from "@/lib/api/types"
import { MICRO } from "@/lib/format"
import { announceTestUsdc } from "@/lib/wallet/announce-test-usdc"

/** Create the chain wallet, then mint $50 test USDC on Solana if under $1. */
export async function provisionChain(chain: ChainId): Promise<WalletBalance> {
    const balance = await ensureChainWallet(chain)
    if (chain !== "solana" || balance.availableMicro >= MICRO) {
        return balance
    }
    const result = await claimTestUsdcOnchain()
    if (!result.ok) {
        throw new Error(result.error)
    }
    if (result.data.minted) {
        announceTestUsdc(result.data.amountMicro)
    }
    return result.data.balance
}
