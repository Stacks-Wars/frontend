import "server-only"

import { randomSeedPhrase } from "@stacks/wallet-sdk"

import type { ChainId } from "@/lib/chain"
import { encryptWithKms, mnemonicAad } from "@/lib/kms/envelope"
import { deriveCustodialAccountFromMnemonic } from "@/lib/stacks/wallet-from-mnemonic"
import { getStacksNetworkName } from "@/lib/stacks/network"
import { deriveSolanaAccountFromMnemonic } from "@/lib/solana/wallet-from-mnemonic"
import { getSolanaNetworkName } from "@/lib/solana/network"

export type CustodialWalletMaterial = {
    address: string
    publicKey: string
    encryptedSigningMaterial: string
    kmsKeyVersion: string
    network: string
    chain: ChainId
}

async function createStacksMaterial(
    userId: string
): Promise<CustodialWalletMaterial> {
    const network = getStacksNetworkName()
    const mnemonic = randomSeedPhrase(256)
    const account = await deriveCustodialAccountFromMnemonic(mnemonic)
    const encrypted = await encryptWithKms(
        mnemonic,
        mnemonicAad(userId, network, "stacks")
    )

    return {
        address: account.address,
        publicKey: account.publicKey,
        encryptedSigningMaterial: encrypted.ciphertext,
        kmsKeyVersion: encrypted.kmsKeyVersion,
        network,
        chain: "stacks",
    }
}

async function createSolanaMaterial(
    userId: string
): Promise<CustodialWalletMaterial> {
    const network = getSolanaNetworkName()
    const mnemonic = randomSeedPhrase(256)
    const account = await deriveSolanaAccountFromMnemonic(mnemonic)
    const encrypted = await encryptWithKms(
        mnemonic,
        mnemonicAad(userId, network, "solana")
    )

    return {
        address: account.address,
        publicKey: account.publicKey,
        encryptedSigningMaterial: encrypted.ciphertext,
        kmsKeyVersion: encrypted.kmsKeyVersion,
        network,
        chain: "solana",
    }
}

/** Generate + encrypt a custodial wallet for one chain. Persistence is the API. */
export async function createCustodialWalletMaterial(
    userId: string,
    chain: ChainId
): Promise<CustodialWalletMaterial> {
    if (chain === "solana") return createSolanaMaterial(userId)
    return createStacksMaterial(userId)
}
