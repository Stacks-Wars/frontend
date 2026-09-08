import "server-only"

import { randomSeedPhrase } from "@stacks/wallet-sdk"

import { chainAdapter, type ChainId } from "@/lib/chain"
import { encryptWithKms, mnemonicAad } from "@/lib/kms/envelope"
import { deriveArbitrumWalletFromMnemonic } from "@/lib/arbitrum/wallet-from-mnemonic"
import { deriveBotchainWalletFromMnemonic } from "@/lib/botchain/wallet-from-mnemonic"
import { deriveCustodialAccountFromMnemonic } from "@/lib/stacks/wallet-from-mnemonic"
import { deriveSolanaAccountFromMnemonic } from "@/lib/solana/wallet-from-mnemonic"

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
    const network = chainAdapter("stacks").playNetwork()
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
    const network = chainAdapter("solana").playNetwork()
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

async function createEvmMaterial(
    userId: string,
    chain: "arbitrum" | "botchain"
): Promise<CustodialWalletMaterial> {
    const network = chainAdapter(chain).playNetwork()
    const mnemonic = randomSeedPhrase(256)
    const account =
        chain === "arbitrum"
            ? deriveArbitrumWalletFromMnemonic(mnemonic)
            : deriveBotchainWalletFromMnemonic(mnemonic)
    const encrypted = await encryptWithKms(
        mnemonic,
        mnemonicAad(userId, network, chain)
    )

    return {
        address: account.address,
        publicKey: account.publicKey,
        encryptedSigningMaterial: encrypted.ciphertext,
        kmsKeyVersion: encrypted.kmsKeyVersion,
        network,
        chain,
    }
}

/** Generate + encrypt a custodial wallet for one chain. Persistence is the API. */
export async function createCustodialWalletMaterial(
    userId: string,
    chain: ChainId
): Promise<CustodialWalletMaterial> {
    switch (chain) {
        case "solana":
            return createSolanaMaterial(userId)
        case "stacks":
            return createStacksMaterial(userId)
        case "arbitrum":
        case "botchain":
            return createEvmMaterial(userId, chain)
    }
}
