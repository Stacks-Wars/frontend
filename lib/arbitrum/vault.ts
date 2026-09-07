import "server-only"

/**
 * Platform-sponsored Arbitrum vault calls. Players sign ERC-2612 permit on join.
 * Leave / kick / claim are platform-only. Players never need ETH.
 */

import { keccak256, stringToHex, zeroAddress, type Address, type Hex } from "viem"

import { getSigningMaterial } from "@/lib/api/server"
import { swVaultAbi } from "@/lib/arbitrum/abi"
import { getArbitrumFeePayer } from "@/lib/arbitrum/fee-payer"
import { getArbitrumChain } from "@/lib/arbitrum/network"
import { signArbitrumUsdcPermit } from "@/lib/arbitrum/permit"
import {
    arbitrumWalletClient,
    sendArbitrumPlatformTx,
} from "@/lib/arbitrum/rpc"
import { unlockCustodialArbitrum } from "@/lib/custodial/unlock"
import { arbitrumVault } from "@/lib/config"
import { arbitrumAdapter } from "@/lib/chain/arbitrum"
import { humanizeVaultTxError } from "@/lib/vault/tx-errors"

export function lobbyPathHash(path: string): Hex {
    return keccak256(stringToHex(path))
}

async function sendVault(write: (nonce: number) => Promise<Hex>): Promise<string> {
    try {
        return await sendArbitrumPlatformTx(write)
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(humanizeVaultTxError(message))
    }
}

export async function arbitrumVaultJoin(input: {
    userId: string
    lobbyPath: string
    amountMicro: number
}): Promise<string> {
    const player = await unlockCustodialArbitrum(
        await getSigningMaterial(input.userId, "arbitrum")
    )
    const amount = BigInt(input.amountMicro)
    const vault = arbitrumVault() as Address
    const permit = await signArbitrumUsdcPermit({
        owner: player.address as Address,
        spender: vault,
        value: amount,
        signTypedData: (typed) => player.account.signTypedData(typed),
    })
    const payer = getArbitrumFeePayer()
    const wallet = arbitrumWalletClient(payer)
    const hash = await sendVault((nonce) =>
        wallet.writeContract({
            account: payer,
            chain: getArbitrumChain(),
            address: vault,
            abi: swVaultAbi,
            functionName: "joinWithPermit",
            nonce,
            args: [
                player.address as Address,
                lobbyPathHash(input.lobbyPath),
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

export async function arbitrumVaultLeave(input: {
    lobbyPath: string
    playerAddress: string
}): Promise<string> {
    return arbitrumVaultRefund("leaveSeat", input)
}

export async function arbitrumVaultKick(input: {
    lobbyPath: string
    playerAddress: string
}): Promise<string> {
    return arbitrumVaultRefund("kick", input)
}

async function arbitrumVaultRefund(
    kind: "leaveSeat" | "kick",
    input: { lobbyPath: string; playerAddress: string }
): Promise<string> {
    const player = arbitrumAdapter.parseAddress(input.playerAddress)
    if (!player) {
        throw new Error("Player wallet is not an Arbitrum address.")
    }
    const payer = getArbitrumFeePayer()
    const wallet = arbitrumWalletClient(payer)
    return sendVault((nonce) =>
        wallet.writeContract({
            account: payer,
            chain: getArbitrumChain(),
            address: arbitrumVault() as Address,
            abi: swVaultAbi,
            functionName: kind,
            nonce,
            args: [player as Address, lobbyPathHash(input.lobbyPath)],
        })
    )
}

export async function arbitrumVaultClaim(input: {
    lobbyPath: string
    playerAddress: string
    amountMicro: number
    destFeePct: number
    destAddress: string
}): Promise<string> {
    const player = arbitrumAdapter.parseAddress(input.playerAddress)
    if (!player) {
        throw new Error("Player wallet is not an Arbitrum address.")
    }
    const parsedDest = arbitrumAdapter.parseAddress(input.destAddress)
    const payer = getArbitrumFeePayer()
    const payDest =
        parsedDest != null &&
        parsedDest.toLowerCase() !== payer.address.toLowerCase() &&
        parsedDest.toLowerCase() !== player.toLowerCase() &&
        input.destFeePct > 0
    const dest = payDest ? (parsedDest as Address) : zeroAddress
    const destFeePct = payDest ? Math.min(5, Math.max(0, input.destFeePct)) : 0
    const wallet = arbitrumWalletClient(payer)
    return sendVault((nonce) =>
        wallet.writeContract({
            account: payer,
            chain: getArbitrumChain(),
            address: arbitrumVault() as Address,
            abi: swVaultAbi,
            functionName: "claim",
            nonce,
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
