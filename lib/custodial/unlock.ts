import "server-only"

import { updateCustodialEncryption } from "@/lib/api/server"
import type { SigningMaterial } from "@/lib/api/server"
import {
    decryptWithKms,
    encryptWithKms,
    mnemonicAad,
    usesMnemonicAad,
} from "@/lib/kms/envelope"
import {
    createKeyPairSignerFromPrivateKeyBytes,
    type TransactionSigner,
} from "@solana/kit"

import { parseChainId } from "@/lib/chain"
import { deriveSolanaAccountFromMnemonic } from "@/lib/solana/wallet-from-mnemonic"
import { deriveCustodialAccountFromMnemonic } from "@/lib/stacks/wallet-from-mnemonic"

export type UnlockedCustodialAccount = {
    address: string
    senderKey: string
    /**
     * After a successful sign, re-seal a version-1 seed with AAD under
     * the current KMS version. No-op when the row is already version 2+.
     */
    persistV2IfNeeded: () => Promise<void>
}

/**
 * Open the custodial Stacks seed for signing. KMS version 1 has no AAD; 2+ does.
 * Call `persistV2IfNeeded` after the transaction is signed.
 */
async function decryptMnemonic(material: SigningMaterial): Promise<{
    mnemonic: string
    aad: string
    withAad: boolean
    chain: ReturnType<typeof parseChainId>
}> {
    const chain = parseChainId(material.chain)
    const aad = mnemonicAad(material.userId, material.network, chain)
    const withAad = usesMnemonicAad(material.kmsKeyVersion)
    const mnemonic = await decryptWithKms(material.encryptedSigningMaterial, {
        kmsKeyVersion: material.kmsKeyVersion,
        ...(withAad ? { aad } : {}),
    })
    return { mnemonic, aad, withAad, chain }
}

function persistV2(
    material: SigningMaterial,
    mnemonic: string,
    aad: string,
    withAad: boolean,
    chain: ReturnType<typeof parseChainId>
) {
    return async () => {
        if (withAad) return
        try {
            const sealed = await encryptWithKms(mnemonic, aad)
            await updateCustodialEncryption(material.userId, {
                encryptedSigningMaterial: sealed.ciphertext,
                kmsKeyVersion: sealed.kmsKeyVersion,
                chain,
            })
        } catch (error) {
            console.error("[wallet] v1→v2 rewrap failed", error)
        }
    }
}

export async function unlockCustodialAccount(
    material: SigningMaterial
): Promise<UnlockedCustodialAccount> {
    const { mnemonic, aad, withAad, chain } = await decryptMnemonic(material)
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
        persistV2IfNeeded: persistV2(material, mnemonic, aad, withAad, chain),
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
    const { mnemonic, aad, withAad, chain } = await decryptMnemonic(material)
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
        persistV2IfNeeded: persistV2(material, mnemonic, aad, withAad, chain),
    }
}
