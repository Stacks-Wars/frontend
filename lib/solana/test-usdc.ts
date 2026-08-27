import "server-only"

/**
 * Devnet-only: mint $50 of our USDC into a player's ATA so they can play
 * without a faucet. Platform key is mint authority. Never runs on mainnet.
 */

import {
    findAssociatedTokenPda,
    getCreateAssociatedTokenIdempotentInstruction,
    getMintToCheckedInstruction,
    TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token"
import {
    address,
    getSignatureFromTransaction,
    type Address,
} from "@solana/kit"

import { getSolanaFeePayer } from "@/lib/solana/fee-payer"
import {
    getSolanaUsdcMint,
    isSolanaTestUsdcEnabled,
    SOLANA_CLAIM_MIN_AMOUNT,
    SOLANA_TEST_USDC_AMOUNT,
    SOLANA_USDC_DECIMALS,
} from "@/lib/solana/network"
import { solanaRpc, solanaSender, waitForSolanaSignature } from "@/lib/solana/rpc"
import { compileSponsoredTransaction } from "@/lib/solana/sponsor"

async function tokenAmount(ata: Address): Promise<bigint> {
    try {
        const { value } = await solanaRpc().getTokenAccountBalance(ata).send()
        return BigInt(value.amount)
    } catch {
        return BigInt(0)
    }
}

/**
 * Mint $50 test USDC if this wallet has none of our mint yet.
 * Idempotent: skips when the ATA already holds a balance.
 */
export async function fundSolanaTestUsdc(
    ownerAddress: string
): Promise<string | null> {
    if (!isSolanaTestUsdcEnabled()) return null

    const payer = await getSolanaFeePayer()
    const mint = address(getSolanaUsdcMint())
    const owner = address(ownerAddress)
    const [ata] = await findAssociatedTokenPda({
        owner,
        mint,
        tokenProgram: TOKEN_PROGRAM_ADDRESS,
    })

    const existing = await tokenAmount(ata)
    if (existing >= SOLANA_CLAIM_MIN_AMOUNT) return null

    const createAta = getCreateAssociatedTokenIdempotentInstruction({
        payer,
        ata,
        owner,
        mint,
    })
    const mintTo = getMintToCheckedInstruction({
        mint,
        token: ata,
        mintAuthority: payer,
        amount: SOLANA_TEST_USDC_AMOUNT,
        decimals: SOLANA_USDC_DECIMALS,
    })

    const rpc = solanaRpc()
    const { value } = await rpc.getLatestBlockhash().send()
    const signed = await compileSponsoredTransaction({
        payer,
        instructions: [createAta, mintTo],
        lifetime: {
            blockhash: value.blockhash,
            lastValidBlockHeight: value.lastValidBlockHeight,
        },
    })
    await solanaSender()(signed, { commitment: "confirmed" })
    const signature = getSignatureFromTransaction(signed)
    return waitForSolanaSignature(signature, value.lastValidBlockHeight)
}
