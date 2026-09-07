"use server"

/**
 * Platform-sponsored USDC transfer from the custodial EOA.
 * Player signs; platform pays gas.
 */

import type { Address } from "viem"

import { getSigningMaterial } from "@/lib/api/server"
import { usdCxAbi } from "@/lib/arbitrum/abi"
import { getArbitrumFeePayer } from "@/lib/arbitrum/fee-payer"
import { getArbitrumChain, getArbitrumNetworkName } from "@/lib/arbitrum/network"
import {
    signArbitrumUsdcPermit,
    signArbitrumUsdcTransferAuth,
} from "@/lib/arbitrum/permit"
import {
    arbitrumWalletClient,
    sendArbitrumPlatformTx,
} from "@/lib/arbitrum/rpc"
import { unlockCustodialArbitrum } from "@/lib/custodial/unlock"
import { arbitrumAdapter } from "@/lib/chain/arbitrum"
import { arbitrumUsdc } from "@/lib/config"

export async function broadcastArbitrumUsdcTransfer(input: {
    userId: string
    amountMicro: number
    toAddress: string
}): Promise<string> {
    const dest = arbitrumAdapter.parseAddress(input.toAddress)
    if (!dest) {
        throw new Error("That does not look like an Arbitrum address.")
    }
    if (input.amountMicro <= 0) {
        throw new Error("Enter an amount.")
    }

    const player = await unlockCustodialArbitrum(
        await getSigningMaterial(input.userId, "arbitrum")
    )
    if (player.address.toLowerCase() === dest.toLowerCase()) {
        throw new Error("Pick a different destination than this custodial wallet.")
    }

    const usdc = arbitrumUsdc() as Address
    const amount = BigInt(input.amountMicro)
    const payer = getArbitrumFeePayer()
    const wallet = arbitrumWalletClient(payer)
    const chain = getArbitrumChain()

    if (getArbitrumNetworkName() === "one") {
        const auth = await signArbitrumUsdcTransferAuth({
            from: player.address as Address,
            to: dest as Address,
            value: amount,
            signTypedData: (typed) => player.account.signTypedData(typed),
        })
        const hash = await sendArbitrumPlatformTx((nonce) =>
            wallet.writeContract({
                account: payer,
                chain,
                address: usdc,
                abi: usdCxAbi,
                functionName: "transferWithAuthorization",
                nonce,
                args: [
                    player.address as Address,
                    dest as Address,
                    amount,
                    auth.validAfter,
                    auth.validBefore,
                    auth.nonce,
                    auth.v,
                    auth.r,
                    auth.s,
                ],
            })
        )
        await player.persistV2IfNeeded()
        return hash
    }

    const permit = await signArbitrumUsdcPermit({
        owner: player.address as Address,
        spender: payer.address,
        value: amount,
        signTypedData: (typed) => player.account.signTypedData(typed),
    })
    const hash = await sendArbitrumPlatformTx((nonce) =>
        wallet.writeContract({
            account: payer,
            chain,
            address: usdc,
            abi: usdCxAbi,
            functionName: "transferWithPermit",
            nonce,
            args: [
                player.address as Address,
                dest as Address,
                amount,
                permit.deadline,
                permit.v,
                permit.r,
                permit.s,
            ],
        })
    )
    await player.persistV2IfNeeded()
    return hash
}
