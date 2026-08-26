"use server"

/**
 * Sponsored SPL transfer of our play USDC from the custodial ATA.
 * Platform pays SOL; the player signs as token authority.
 */

import {
    findAssociatedTokenPda,
    getCreateAssociatedTokenIdempotentInstruction,
    getTransferCheckedInstruction,
    TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token"
import {
    address,
    getSignatureFromTransaction,
} from "@solana/kit"

import { getSigningMaterial } from "@/lib/api/server"
import { unlockCustodialSolana } from "@/lib/custodial/unlock"
import { getSolanaFeePayer } from "@/lib/solana/fee-payer"
import {
    getSolanaUsdcMint,
    SOLANA_USDC_DECIMALS,
} from "@/lib/solana/network"
import { solanaRpc, solanaSender, waitForSolanaSignature } from "@/lib/solana/rpc"
import { compileSponsoredTransaction } from "@/lib/solana/sponsor"
import { solanaAdapter } from "@/lib/chain/solana"

export async function broadcastSolanaUsdcTransfer(input: {
    userId: string
    amountMicro: number
    toAddress: string
}): Promise<string> {
    const dest = solanaAdapter.parseAddress(input.toAddress)
    if (!dest) {
        throw new Error("That does not look like a Solana address.")
    }
    if (input.amountMicro <= 0) {
        throw new Error("Enter an amount.")
    }

    const player = await unlockCustodialSolana(
        await getSigningMaterial(input.userId, "solana")
    )
    if (player.address === dest) {
        throw new Error("Pick a different destination than this custodial wallet.")
    }

    const payer = await getSolanaFeePayer()
    const mint = address(getSolanaUsdcMint())
    const owner = address(player.address)
    const destination = address(dest)
    const [sourceAta] = await findAssociatedTokenPda({
        owner,
        mint,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
    })
    const [destAta] = await findAssociatedTokenPda({
        owner: destination,
        mint,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
    })

    const createAta = getCreateAssociatedTokenIdempotentInstruction({
        payer,
        ata: destAta,
        owner: destination,
        mint,
    })
    const transfer = getTransferCheckedInstruction({
        source: sourceAta,
        mint,
        destination: destAta,
        authority: player.signer,
        amount: BigInt(input.amountMicro),
        decimals: SOLANA_USDC_DECIMALS,
    })

    const rpc = solanaRpc()
    const { value } = await rpc.getLatestBlockhash().send()
    const signed = await compileSponsoredTransaction({
        payer,
        instructions: [createAta, transfer],
        lifetime: {
            blockhash: value.blockhash,
            lastValidBlockHeight: value.lastValidBlockHeight,
        },
    })
    await solanaSender()(signed, { commitment: "confirmed" })
    const signature = getSignatureFromTransaction(signed)
    await player.persistV2IfNeeded()
    return waitForSolanaSignature(signature, value.lastValidBlockHeight)
}
