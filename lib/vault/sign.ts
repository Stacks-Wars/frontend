"use server"

/**
 * Oracle signatures for sw-vault-v1 leave/kick/claim.
 * Uses STACKS_WARS_KEY (mnemonic) — same key baked as TRUSTED-PUBLIC-KEY on deploy.
 */

import { createHash } from "crypto"
import {
    principalCV,
    serializeCV,
    signMessageHashRsv,
    stringAsciiCV,
    tupleCV,
    uintCV,
    type TupleCV,
} from "@stacks/transactions"
import { generateWallet, type Wallet } from "@stacks/wallet-sdk"

export type VaultSignAction = "leave" | "kick" | "claim"

async function oraclePrivateKey(): Promise<string> {
    const mnemonic = process.env.STACKS_WARS_KEY?.trim()
    if (!mnemonic) {
        throw new Error("STACKS_WARS_KEY is not configured")
    }
    const wallet: Wallet = await generateWallet({
        secretKey: mnemonic,
        password: "",
    })
    const key = wallet.accounts[0]?.stxPrivateKey
    if (!key) {
        throw new Error("Failed to derive STACKS_WARS_KEY account")
    }
    return key
}

/** Fee-sponsor private key (same STACKS_WARS_KEY account). */
export async function getSponsorPrivateKey(): Promise<string> {
    return oraclePrivateKey()
}

/** Platform principal derived from STACKS_WARS_KEY (kick janitor sender). */
export async function getPlatformAccount(): Promise<{
    stxAddress: string
    privateKey: string
}> {
    const mnemonic = process.env.STACKS_WARS_KEY?.trim()
    if (!mnemonic) {
        throw new Error("STACKS_WARS_KEY is not configured")
    }
    const { deriveCustodialAccountFromMnemonic } = await import(
        "@/lib/stacks/wallet-from-mnemonic"
    )
    const account = await deriveCustodialAccountFromMnemonic(mnemonic)
    return {
        stxAddress: account.stxAddress,
        privateKey: account.stxPrivateKey,
    }
}

async function hashAndSign(message: TupleCV): Promise<string> {
    const serialized = serializeCV(message)
    const hex =
        typeof serialized === "string"
            ? serialized
            : Buffer.from(serialized).toString("hex")
    const buffer = Buffer.from(hex, "hex")
    const hash = createHash("sha256").update(buffer).digest()
    const privateKey = await oraclePrivateKey()
    const sig = signMessageHashRsv({
        messageHash: hash.toString("hex"),
        privateKey,
    })
    return typeof sig === "string" ? sig : String(sig)
}

/** Sign leave/kick oracle messages matching Clarity construct-message-hash. */
export async function signVaultOracle(input: {
    action: Exclude<VaultSignAction, "claim">
    lobbyPath: string
    player: string
    amount: number
    nonce: number
}): Promise<string> {
    return hashAndSign(
        tupleCV({
            action: stringAsciiCV(input.action),
            "lobby-path": stringAsciiCV(input.lobbyPath),
            player: principalCV(input.player),
            amount: uintCV(input.amount),
            nonce: uintCV(input.nonce),
        })
    )
}

/** Sign claim oracle message matching Clarity construct-claim-message-hash. */
export async function signVaultClaimOracle(input: {
    lobbyPath: string
    player: string
    amount: number
    nonce: number
    devWallet: string
    devFee: number
}): Promise<string> {
    return hashAndSign(
        tupleCV({
            action: stringAsciiCV("claim"),
            "lobby-path": stringAsciiCV(input.lobbyPath),
            player: principalCV(input.player),
            amount: uintCV(input.amount),
            nonce: uintCV(input.nonce),
            "dev-wallet": principalCV(input.devWallet),
            "dev-fee": uintCV(input.devFee),
        })
    )
}
