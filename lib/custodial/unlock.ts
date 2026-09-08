import "server-only"

import { updateCustodialEncryption } from "@/lib/api/server"
import type { SigningMaterial } from "@/lib/api/server"
import {
    decryptWithKms,
    encryptWithKms,
    legacyEvmMnemonicAads,
    mnemonicAad,
    usesMnemonicAad,
} from "@/lib/kms/envelope"
import type { LocalAccount } from "viem/accounts"
import {
    createKeyPairSignerFromPrivateKeyBytes,
    type TransactionSigner,
} from "@solana/kit"

import { isEvmChain, parseChainId } from "@/lib/chain"
import { deriveArbitrumAccountFromMnemonic } from "@/lib/arbitrum/wallet-from-mnemonic"
import { deriveBotchainAccountFromMnemonic } from "@/lib/botchain/wallet-from-mnemonic"
import { deriveSolanaAccountFromMnemonic } from "@/lib/solana/wallet-from-mnemonic"
import { deriveCustodialAccountFromMnemonic } from "@/lib/stacks/wallet-from-mnemonic"

export type UnlockedCustodialAccount = {
    address: string
    senderKey: string
    /**
     * After a successful sign, re-seal a version-1 seed with AAD, or
     * migrate an EVM envelope onto the shared cluster AAD.
     */
    persistV2IfNeeded: () => Promise<void>
}

/**
 * Open the custodial seed. KMS version 1 has no AAD; 2+ does.
 * EVM v2 rows may still be sealed with the old per-chain AAD until rewrap.
 * Call `persistV2IfNeeded` after the transaction is signed.
 */
async function decryptMnemonic(material: SigningMaterial): Promise<{
    mnemonic: string
    aad: string
    withAad: boolean
    needsRewrap: boolean
    chain: ReturnType<typeof parseChainId>
}> {
    const chain = parseChainId(material.chain)
    const aad = mnemonicAad(material.userId, material.network, chain)
    const withAad = usesMnemonicAad(material.kmsKeyVersion)
    if (!withAad) {
        const mnemonic = await decryptWithKms(material.encryptedSigningMaterial, {
            kmsKeyVersion: material.kmsKeyVersion,
        })
        return { mnemonic, aad, withAad, needsRewrap: false, chain }
    }

    try {
        const mnemonic = await decryptWithKms(
            material.encryptedSigningMaterial,
            { kmsKeyVersion: material.kmsKeyVersion, aad }
        )
        return { mnemonic, aad, withAad, needsRewrap: false, chain }
    } catch (error) {
        if (!isEvmChain(chain)) throw error
        for (const legacy of legacyEvmMnemonicAads(
            material.userId,
            material.network,
            chain
        )) {
            if (legacy === aad) continue
            try {
                const mnemonic = await decryptWithKms(
                    material.encryptedSigningMaterial,
                    { kmsKeyVersion: material.kmsKeyVersion, aad: legacy }
                )
                return { mnemonic, aad, withAad, needsRewrap: true, chain }
            } catch {
                // Try the next historical EVM AAD in this cluster.
            }
        }
        throw error
    }
}

function persistV2(
    material: SigningMaterial,
    mnemonic: string,
    aad: string,
    withAad: boolean,
    needsRewrap: boolean,
    chain: ReturnType<typeof parseChainId>
) {
    return async () => {
        if (withAad && !needsRewrap) return
        try {
            const sealed = await encryptWithKms(mnemonic, aad)
            await updateCustodialEncryption(material.userId, {
                encryptedSigningMaterial: sealed.ciphertext,
                kmsKeyVersion: sealed.kmsKeyVersion,
                chain,
                rewrap: needsRewrap,
            })
        } catch (error) {
            console.error(
                needsRewrap
                    ? "[wallet] EVM AAD rewrap failed"
                    : "[wallet] v1→v2 rewrap failed",
                error
            )
        }
    }
}

/** Rewrap a sibling EVM envelope onto the shared cluster AAD before copying it. */
export async function rewrapEvmSigningMaterial(
    material: SigningMaterial
): Promise<SigningMaterial> {
    const { mnemonic, aad, needsRewrap, chain } = await decryptMnemonic(material)
    if (!needsRewrap) return material
    try {
        const sealed = await encryptWithKms(mnemonic, aad)
        await updateCustodialEncryption(material.userId, {
            encryptedSigningMaterial: sealed.ciphertext,
            kmsKeyVersion: sealed.kmsKeyVersion,
            chain,
            rewrap: true,
        })
        return {
            ...material,
            encryptedSigningMaterial: sealed.ciphertext,
            kmsKeyVersion: sealed.kmsKeyVersion,
        }
    } catch (error) {
        console.error("[wallet] EVM AAD rewrap failed", error)
        return material
    }
}

export async function unlockCustodialAccount(
    material: SigningMaterial
): Promise<UnlockedCustodialAccount> {
    const { mnemonic, aad, withAad, needsRewrap, chain } =
        await decryptMnemonic(material)
    if (chain !== "stacks") {
        throw new Error("This signing path is Stacks-only.")
    }

    const account = await deriveCustodialAccountFromMnemonic(mnemonic)
    const expected = material.address
    if (account.address !== expected) {
        throw new Error(
            "Custodial mnemonic does not match this wallet address."
        )
    }

    return {
        address: account.address,
        senderKey: account.stxPrivateKey,
        persistV2IfNeeded: persistV2(
            material,
            mnemonic,
            aad,
            withAad,
            needsRewrap,
            chain
        ),
    }
}

export type UnlockedSolanaAccount = {
    address: string
    signer: TransactionSigner
    persistV2IfNeeded: () => Promise<void>
}

/** Open the custodial Solana seed. Platform still pays SOL as fee payer. */
export async function unlockCustodialSolana(
    material: SigningMaterial
): Promise<UnlockedSolanaAccount> {
    const { mnemonic, aad, withAad, needsRewrap, chain } =
        await decryptMnemonic(material)
    if (chain !== "solana") {
        throw new Error("This signing path is Solana-only.")
    }

    const account = await deriveSolanaAccountFromMnemonic(mnemonic)
    if (account.address !== material.address) {
        throw new Error(
            "Custodial mnemonic does not match this wallet address."
        )
    }

    return {
        address: account.address,
        signer: await createKeyPairSignerFromPrivateKeyBytes(
            account.privateKeyBytes
        ),
        persistV2IfNeeded: persistV2(
            material,
            mnemonic,
            aad,
            withAad,
            needsRewrap,
            chain
        ),
    }
}

export type UnlockedArbitrumAccount = {
    address: string
    account: LocalAccount
    persistV2IfNeeded: () => Promise<void>
}

/** Open the custodial Arbitrum seed. Platform still pays ETH as fee payer. */
export async function unlockCustodialArbitrum(
    material: SigningMaterial
): Promise<UnlockedArbitrumAccount> {
    const { mnemonic, aad, withAad, needsRewrap, chain } =
        await decryptMnemonic(material)
    if (chain !== "arbitrum") {
        throw new Error("This signing path is Arbitrum-only.")
    }

    const account = deriveArbitrumAccountFromMnemonic(mnemonic)
    if (account.address.toLowerCase() !== material.address.toLowerCase()) {
        throw new Error(
            "Custodial mnemonic does not match this wallet address."
        )
    }

    return {
        address: account.address,
        account,
        persistV2IfNeeded: persistV2(
            material,
            mnemonic,
            aad,
            withAad,
            needsRewrap,
            chain
        ),
    }
}

export type UnlockedBotchainAccount = UnlockedArbitrumAccount

/** Open the custodial BOT Chain seed. Platform still pays BOT as fee payer. */
export async function unlockCustodialBotchain(
    material: SigningMaterial
): Promise<UnlockedBotchainAccount> {
    const { mnemonic, aad, withAad, needsRewrap, chain } =
        await decryptMnemonic(material)
    if (chain !== "botchain") {
        throw new Error("This signing path is BOT Chain-only.")
    }

    const account = deriveBotchainAccountFromMnemonic(mnemonic)
    if (account.address.toLowerCase() !== material.address.toLowerCase()) {
        throw new Error(
            "Custodial mnemonic does not match this wallet address."
        )
    }

    return {
        address: account.address,
        account,
        persistV2IfNeeded: persistV2(
            material,
            mnemonic,
            aad,
            withAad,
            needsRewrap,
            chain
        ),
    }
}
