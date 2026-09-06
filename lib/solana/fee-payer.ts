import "server-only"

import {
    createKeyPairSignerFromPrivateKeyBytes,
    type TransactionSigner,
} from "@solana/kit"

import { DEV_SOLANA_MNEMONIC, env } from "@/lib/config"
import { deriveSolanaAccountFromMnemonic } from "@/lib/solana/wallet-from-mnemonic"

let cached: Promise<TransactionSigner> | null = null

/**
 * Platform fee-payer + remaining signer. Pays SOL so the player only signs
 * as USDC authority. Same key as `initialize` `platform` and leave/kick/claim.
 *
 * Set `SOLANA_KEY` (BIP39 mnemonic), same path as custodial Solana:
 * `m/44'/501'/0'/0'`.
 */
export async function getSolanaFeePayer(): Promise<TransactionSigner> {
    if (!cached) {
        cached = loadFeePayer()
    }
    return cached
}

async function loadFeePayer(): Promise<TransactionSigner> {
    const mnemonic = env("SOLANA_KEY", DEV_SOLANA_MNEMONIC)
    const account = await deriveSolanaAccountFromMnemonic(mnemonic)
    return createKeyPairSignerFromPrivateKeyBytes(account.privateKeyBytes)
}
