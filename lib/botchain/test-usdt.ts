import "server-only"

/**
 * Dest-only $50 mint of play USDT on BOT Chain Bohr.
 * Platform (minter) pays gas. Players never need BOT.
 */

import { PLAY_CLAIM_MIN_MICRO, PLAY_MINT_MICRO } from "@/lib/chain/play"
import { botchainUsdt, isDev } from "@/lib/config"
import { usdtAbi } from "@/lib/botchain/abi"
import { getBotchainFeePayer } from "@/lib/botchain/fee-payer"
import {
    botchainPublicClient,
    botchainWalletClient,
    sendBotchainPlatformTx,
} from "@/lib/botchain/rpc"
import { botchainAdapter } from "@/lib/chain/botchain"
import type { Address } from "viem"

export async function fundBotchainTestUsdt(
    ownerAddress: string
): Promise<string | null> {
    if (!isDev()) return null

    const owner = botchainAdapter.parseAddress(ownerAddress)
    if (!owner) {
        throw new Error("That does not look like a BOT Chain address.")
    }

    const usdt = botchainUsdt() as Address
    const publicClient = botchainPublicClient()
    const existing = await publicClient.readContract({
        address: usdt,
        abi: usdtAbi,
        functionName: "balanceOf",
        args: [owner as Address],
    })
    if (existing >= PLAY_CLAIM_MIN_MICRO) return null

    const payer = getBotchainFeePayer()
    const wallet = botchainWalletClient(payer)
    return sendBotchainPlatformTx((nonce, gasPrice) =>
        wallet.writeContract({
            account: payer,
            chain: publicClient.chain,
            address: usdt,
            abi: usdtAbi,
            functionName: "mint",
            nonce,
            gasPrice,
            args: [owner as Address, PLAY_MINT_MICRO],
        })
    )
}
