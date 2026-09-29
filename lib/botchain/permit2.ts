import "server-only"

import { randomBytes } from "node:crypto"
import { maxUint256, parseEther, toHex, type Address, type Hex, type LocalAccount } from "viem"

import { getBotchainFeePayer } from "@/lib/botchain/fee-payer"
import { usdtAbi } from "@/lib/botchain/abi"
import { getBotchainChain, getBotchainChainId } from "@/lib/botchain/network"
import {
    botchainPublicClient,
    botchainWalletClient,
    sendBotchainPlatformTx,
    waitForBotchainTx,
} from "@/lib/botchain/rpc"
import { BOTCHAIN_PERMIT2, botchainUsdt, isDev } from "@/lib/config"

const PERMIT2 = BOTCHAIN_PERMIT2 as Address
const DUST_BOT = parseEther("0.05")
const MIN_PLAYER_BOT = parseEther("0.01")
/** Generous ceiling for the player's one-time approve, used to size the top-up. */
const APPROVE_GAS_LIMIT = BigInt(100_000)

/**
 * Shown when the platform cannot fund a new player's gas. The player's USDT is
 * irrelevant here, so the message must not send them to the wallet page.
 */
export const PLATFORM_GAS_SHORTFALL_MESSAGE =
    "Match payments are briefly unavailable. Try again in a few minutes."

type SignTypedData = (typed: {
    domain: {
        name: string
        chainId: number
        verifyingContract: Address
    }
    types: Record<string, { name: string; type: string }[]>
    primaryType: string
    message: Record<string, unknown>
}) => Promise<Hex>

export async function signBotchainPermit2Transfer(input: {
    owner: Address
    spender: Address
    token: Address
    amount: bigint
    signTypedData: SignTypedData
}): Promise<{ nonce: bigint; deadline: bigint; signature: Hex }> {
    const nonce = BigInt(toHex(randomBytes(32)))
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
    const signature = await input.signTypedData({
        domain: {
            name: "Permit2",
            chainId: getBotchainChainId(),
            verifyingContract: PERMIT2,
        },
        types: {
            PermitTransferFrom: [
                { name: "permitted", type: "TokenPermissions" },
                { name: "spender", type: "address" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
            TokenPermissions: [
                { name: "token", type: "address" },
                { name: "amount", type: "uint256" },
            ],
        },
        primaryType: "PermitTransferFrom",
        message: {
            permitted: { token: input.token, amount: input.amount },
            spender: input.spender,
            nonce,
            deadline,
        },
    })
    return { nonce, deadline, signature }
}

/** Official USDT has no permit. One-time max approve of Permit2, funded with dust BOT if needed. */
export async function ensureBotchainPermit2Allowance(input: {
    player: Address
    account: LocalAccount
    amount: bigint
}): Promise<void> {
    if (isDev()) return
    const usdt = botchainUsdt() as Address
    const client = botchainPublicClient()
    const allowance = await client.readContract({
        address: usdt,
        abi: usdtAbi,
        functionName: "allowance",
        args: [input.player, PERMIT2],
    })
    if (allowance >= input.amount) return

    const botBalance = await client.getBalance({ address: input.player })
    if (botBalance < MIN_PLAYER_BOT) {
        const payer = getBotchainFeePayer()
        const payerWallet = botchainWalletClient(payer)
        // The player's approve below is sent from their own account, so they
        // need native gas. Check the platform can actually cover the top-up:
        // otherwise the send fails with a generic low-balance error that reads
        // like the player's own funds are the problem.
        const payerBalance = await client.getBalance({ address: payer.address })
        const gasPrice = await client.getGasPrice()
        const topUpCost = DUST_BOT + gasPrice * APPROVE_GAS_LIMIT
        if (payerBalance < topUpCost) {
            console.error(
                `[botchain] platform payer ${payer.address} holds ${payerBalance} wei ` +
                    `but needs ${topUpCost} wei to gas-fund ${input.player}`
            )
            throw new Error(PLATFORM_GAS_SHORTFALL_MESSAGE)
        }
        await sendBotchainPlatformTx((nonce, gasPrice) =>
            payerWallet.sendTransaction({
                account: payer,
                chain: getBotchainChain(),
                to: input.player,
                value: DUST_BOT,
                nonce,
                gasPrice,
            })
        )
    }

    const wallet = botchainWalletClient(input.account)
    const gasPrice = await client.getGasPrice()
    const hash = await wallet.writeContract({
        account: input.account,
        chain: getBotchainChain(),
        address: usdt,
        abi: usdtAbi,
        functionName: "approve",
        args: [PERMIT2, maxUint256],
        gasPrice,
    })
    await waitForBotchainTx(hash)
}

export function botchainPermit2Address(): Address {
    return PERMIT2
}
