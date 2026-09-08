"use server"

/**
 * Platform-sponsored USDT transfer from the custodial EOA.
 * Dest: ERC-2612 transferWithPermit. Main: Permit2 permitTransferFrom.
 */

import type { Address } from "viem"

import { getSigningMaterial } from "@/lib/api/server"
import { permit2Abi, usdtAbi } from "@/lib/botchain/abi"
import { getBotchainFeePayer } from "@/lib/botchain/fee-payer"
import { getBotchainChain, getBotchainNetworkName } from "@/lib/botchain/network"
import { signBotchainUsdtPermit } from "@/lib/botchain/permit"
import {
    botchainPermit2Address,
    ensureBotchainPermit2Allowance,
    signBotchainPermit2Transfer,
} from "@/lib/botchain/permit2"
import {
    botchainWalletClient,
    sendBotchainPlatformTx,
} from "@/lib/botchain/rpc"
import { unlockCustodialBotchain } from "@/lib/custodial/unlock"
import { botchainAdapter } from "@/lib/chain/botchain"
import { botchainUsdt } from "@/lib/config"

export async function broadcastBotchainUsdtTransfer(input: {
    userId: string
    amountMicro: number
    toAddress: string
}): Promise<string> {
    const dest = botchainAdapter.parseAddress(input.toAddress)
    if (!dest) {
        throw new Error("That does not look like a BOT Chain address.")
    }
    if (input.amountMicro <= 0) {
        throw new Error("Enter an amount.")
    }

    const player = await unlockCustodialBotchain(
        await getSigningMaterial(input.userId, "botchain")
    )
    if (player.address.toLowerCase() === dest.toLowerCase()) {
        throw new Error("Pick a different destination than this custodial wallet.")
    }

    const usdt = botchainUsdt() as Address
    const amount = BigInt(input.amountMicro)
    const payer = getBotchainFeePayer()
    const wallet = botchainWalletClient(payer)
    const chain = getBotchainChain()

    if (getBotchainNetworkName() === "mainnet") {
        await ensureBotchainPermit2Allowance({
            player: player.address as Address,
            account: player.account,
            amount,
        })
        const signed = await signBotchainPermit2Transfer({
            owner: player.address as Address,
            spender: payer.address,
            token: usdt,
            amount,
            signTypedData: (typed) => player.account.signTypedData(typed),
        })
        const hash = await sendBotchainPlatformTx((nonce, gasPrice) =>
            wallet.writeContract({
                account: payer,
                chain,
                address: botchainPermit2Address(),
                abi: permit2Abi,
                functionName: "permitTransferFrom",
                nonce,
                gasPrice,
                args: [
                    {
                        permitted: { token: usdt, amount },
                        nonce: signed.nonce,
                        deadline: signed.deadline,
                    },
                    { to: dest as Address, requestedAmount: amount },
                    player.address as Address,
                    signed.signature,
                ],
            })
        )
        await player.persistV2IfNeeded()
        return hash
    }

    const permit = await signBotchainUsdtPermit({
        owner: player.address as Address,
        spender: payer.address,
        value: amount,
        signTypedData: (typed) => player.account.signTypedData(typed),
    })
    const hash = await sendBotchainPlatformTx((nonce, gasPrice) =>
        wallet.writeContract({
            account: payer,
            chain,
            address: usdt,
            abi: usdtAbi,
            functionName: "transferWithPermit",
            nonce,
            gasPrice,
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
