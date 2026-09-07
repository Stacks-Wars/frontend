import "server-only"

/**
 * Dest-only $50 mint of play USDC on Arbitrum Sepolia.
 * Platform (minter) pays gas. Players never need ETH.
 */

import { PLAY_CLAIM_MIN_MICRO, PLAY_MINT_MICRO } from "@/lib/chain/play"
import { arbitrumUsdc, isDev } from "@/lib/config"
import { usdCxAbi } from "@/lib/arbitrum/abi"
import { getArbitrumFeePayer } from "@/lib/arbitrum/fee-payer"
import {
    arbitrumPublicClient,
    arbitrumWalletClient,
    sendArbitrumPlatformTx,
} from "@/lib/arbitrum/rpc"
import { arbitrumAdapter } from "@/lib/chain/arbitrum"
import type { Address } from "viem"

export async function fundArbitrumTestUsdc(
    ownerAddress: string
): Promise<string | null> {
    if (!isDev()) return null

    const owner = arbitrumAdapter.parseAddress(ownerAddress)
    if (!owner) {
        throw new Error("That does not look like an Arbitrum address.")
    }

    const usdc = arbitrumUsdc() as Address
    const publicClient = arbitrumPublicClient()
    const existing = await publicClient.readContract({
        address: usdc,
        abi: usdCxAbi,
        functionName: "balanceOf",
        args: [owner as Address],
    })
    if (existing >= PLAY_CLAIM_MIN_MICRO) return null

    const payer = getArbitrumFeePayer()
    const wallet = arbitrumWalletClient(payer)
    return sendArbitrumPlatformTx((nonce) =>
        wallet.writeContract({
            account: payer,
            chain: publicClient.chain,
            address: usdc,
            abi: usdCxAbi,
            functionName: "mint",
            nonce,
            args: [owner as Address, PLAY_MINT_MICRO],
        })
    )
}
