import "server-only"

import { updateCustodialEncryption } from "@/lib/api/server"
import type { SigningMaterial } from "@/lib/api/server"
import {
    decryptWithKms,
    encryptWithKms,
    mnemonicAad,
    usesMnemonicAad,
} from "@/lib/kms/envelope"
import { deriveCustodialAccountFromMnemonic } from "@/lib/stacks/wallet-from-mnemonic"

export type UnlockedCustodialAccount = {
    stxAddress: string
    senderKey: string
    /**
     * After a successful sign, re-seal a version-1 seed with AAD under
     * the current KMS version. No-op when the row is already version 2+.
     */
    persistV2IfNeeded: () => Promise<void>
}

/**
 * Open the custodial seed for signing. KMS version 1 has no AAD; 2+ does.
 * Call `persistV2IfNeeded` after the transaction is signed.
 */
export async function unlockCustodialAccount(
    material: SigningMaterial
): Promise<UnlockedCustodialAccount> {
    const aad = mnemonicAad(material.userId, material.network)
    const withAad = usesMnemonicAad(material.kmsKeyVersion)

    const mnemonic = await decryptWithKms(material.encryptedMnemonic, {
        kmsKeyVersion: material.kmsKeyVersion,
        ...(withAad ? { aad } : {}),
    })

    const account = await deriveCustodialAccountFromMnemonic(mnemonic)
    if (account.stxAddress !== material.stxAddress) {
        throw new Error(
            "Custodial mnemonic does not match this wallet address."
        )
    }

    return {
        stxAddress: account.stxAddress,
        senderKey: account.stxPrivateKey,
        persistV2IfNeeded: async () => {
            if (withAad) return
            try {
                const sealed = await encryptWithKms(mnemonic, aad)
                await updateCustodialEncryption(material.userId, {
                    encryptedMnemonic: sealed.ciphertext,
                    kmsKeyVersion: sealed.kmsKeyVersion,
                })
            } catch (error) {
                console.error("[wallet] v1→v2 rewrap failed", error)
            }
        },
    }
}
