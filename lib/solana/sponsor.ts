import "server-only"

/**
 * Solana fee sponsorship: the platform key is the fee payer, the player only
 * signs as token authority. Same idea as Stacks `sponsorTransaction`.
 *
 * @see https://solana.com/developers/cookbook/transactions/fee-sponsorship
 */

import {
    appendTransactionMessageInstructions,
    createTransactionMessage,
    pipe,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
    type Blockhash,
    type Instruction,
    type TransactionSigner,
} from "@solana/kit"

export type BlockhashLifetime = {
    blockhash: Blockhash
    lastValidBlockHeight: bigint
}

/**
 * Build a version-0 message whose first account (fee payer) is `payer`.
 * Instruction signers (the player) still sign; they never need SOL.
 */
export async function compileSponsoredTransaction(input: {
    payer: TransactionSigner
    instructions: readonly Instruction[]
    lifetime: BlockhashLifetime
}) {
    const message = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(input.payer, tx),
        (tx) =>
            setTransactionMessageLifetimeUsingBlockhash(input.lifetime, tx),
        (tx) => appendTransactionMessageInstructions(input.instructions, tx)
    )
    return signTransactionMessageWithSigners(message)
}
