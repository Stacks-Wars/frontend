import "server-only"

/**
 * Platform-sponsored BOT Chain vault calls.
 * Dest: players sign ERC-2612 permit. Main: Permit2 after a one-time USDT approve.
 * Leave / kick / claim are platform-only.
 */

import { keccak256, stringToHex, zeroAddress, type Address, type Hex } from "viem"

import { getSigningMaterial } from "@/lib/api/server"
import { swVaultAbi } from "@/lib/botchain/abi"
import { getBotchainFeePayer } from "@/lib/botchain/fee-payer"
import { getBotchainChain } from "@/lib/botchain/network"
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
import { botchainUsdt, botchainVault, isDev } from "@/lib/config"
import { botchainAdapter } from "@/lib/chain/botchain"
import { humanizeVaultTxError } from "@/lib/vault/tx-errors"

export function lobbyPathHash(path: string): Hex {
    return keccak256(stringToHex(path))
}

async function sendVault(write: (nonce: number, gasPrice: bigint) => Promise<Hex>): Promise<string> {
    try {
        return await sendBotchainPlatformTx(write)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(humanizeVaultTxError(message))
    }
}

export async function botchainVaultJoin(input: {
    userId: string
    lobbyPath: string
    amountMicro: number
}): Promise<string> {
    const player = await unlockCustodialBotchain(
        await getSigningMaterial(input.userId, "botchain")
    )
    const amount = BigInt(input.amountMicro)
    const vault = botchainVault() as Address
    const payer = getBotchainFeePayer()
    const wallet = botchainWalletClient(payer)
    const hash = isDev()
        ? await joinWithPermit(player, vault, amount, input.lobbyPath, wallet, payer)
        : await joinWithPermit2(player, vault, amount, input.lobbyPath, wallet, payer)
    await player.persistV2IfNeeded()
    return hash
}

async function joinWithPermit(
    player: Awaited<ReturnType<typeof unlockCustodialBotchain>>,
    vault: Address,
    amount: bigint,
    lobbyPath: string,
    wallet: ReturnType<typeof botchainWalletClient>,
    payer: ReturnType<typeof getBotchainFeePayer>
): Promise<string> {
    const permit = await signBotchainUsdtPermit({
        owner: player.address as Address,
        spender: vault,
        value: amount,
        signTypedData: (typed) => player.account.signTypedData(typed),
    })
    return sendVault((nonce, gasPrice) =>
        wallet.writeContract({
            account: payer,
            chain: getBotchainChain(),
            address: vault,
            abi: swVaultAbi,
            functionName: "joinWithPermit",
            nonce,
            gasPrice,
            args: [
                player.address as Address,
                lobbyPathHash(lobbyPath),
                amount,
                permit.deadline,
                permit.v,
                permit.r,
                permit.s,
            ],
        })
    )
}

async function joinWithPermit2(
    player: Awaited<ReturnType<typeof unlockCustodialBotchain>>,
    vault: Address,
    amount: bigint,
    lobbyPath: string,
    wallet: ReturnType<typeof botchainWalletClient>,
    payer: ReturnType<typeof getBotchainFeePayer>
): Promise<string> {
    await ensureBotchainPermit2Allowance({
        player: player.address as Address,
        account: player.account,
        amount,
    })
    const signed = await signBotchainPermit2Transfer({
        owner: player.address as Address,
        spender: vault,
        token: botchainUsdt() as Address,
        amount,
        signTypedData: (typed) => player.account.signTypedData(typed),
    })
    return sendVault((nonce, gasPrice) =>
        wallet.writeContract({
            account: payer,
            chain: getBotchainChain(),
            address: vault,
            abi: swVaultAbi,
            functionName: "joinWithPermit2",
            nonce,
            gasPrice,
            args: [
                player.address as Address,
                lobbyPathHash(lobbyPath),
                amount,
                signed.nonce,
                signed.deadline,
                signed.signature,
            ],
        })
    )
}

export async function botchainVaultLeave(input: {
    lobbyPath: string
    playerAddress: string
}): Promise<string> {
    return botchainVaultRefund("leaveSeat", input)
}

export async function botchainVaultKick(input: {
    lobbyPath: string
    playerAddress: string
}): Promise<string> {
    return botchainVaultRefund("kick", input)
}

async function botchainVaultRefund(
    kind: "leaveSeat" | "kick",
    input: { lobbyPath: string; playerAddress: string }
): Promise<string> {
    const player = botchainAdapter.parseAddress(input.playerAddress)
    if (!player) {
        throw new Error("Player wallet is not a BOT Chain address.")
    }
    const payer = getBotchainFeePayer()
    const wallet = botchainWalletClient(payer)
    return sendVault((nonce, gasPrice) =>
        wallet.writeContract({
            account: payer,
            chain: getBotchainChain(),
            address: botchainVault() as Address,
            abi: swVaultAbi,
            functionName: kind,
            nonce,
            gasPrice,
            args: [player as Address, lobbyPathHash(input.lobbyPath)],
        })
    )
}

export async function botchainVaultClaim(input: {
    lobbyPath: string
    playerAddress: string
    amountMicro: number
    destFeePct: number
    destAddress: string
}): Promise<string> {
    const player = botchainAdapter.parseAddress(input.playerAddress)
    if (!player) {
        throw new Error("Player wallet is not a BOT Chain address.")
    }
    const parsedDest = botchainAdapter.parseAddress(input.destAddress)
    const payer = getBotchainFeePayer()
    const payDest =
        parsedDest != null &&
        parsedDest.toLowerCase() !== payer.address.toLowerCase() &&
        parsedDest.toLowerCase() !== player.toLowerCase() &&
        input.destFeePct > 0
    const dest = payDest ? (parsedDest as Address) : zeroAddress
    const destFeePct = payDest ? Math.min(5, Math.max(0, input.destFeePct)) : 0
    const wallet = botchainWalletClient(payer)
    return sendVault((nonce, gasPrice) =>
        wallet.writeContract({
            account: payer,
            chain: getBotchainChain(),
            address: botchainVault() as Address,
            abi: swVaultAbi,
            functionName: "claim",
            nonce,
            gasPrice,
            args: [
                player as Address,
                lobbyPathHash(input.lobbyPath),
                BigInt(input.amountMicro),
                dest,
                destFeePct,
            ],
        })
    )
}

export { botchainPermit2Address }
