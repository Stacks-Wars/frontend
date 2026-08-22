import "server-only"

import { randomSeedPhrase } from "@stacks/wallet-sdk"

import { encryptWithKms, mnemonicAad } from "@/lib/kms/envelope"
import { deriveCustodialAccountFromMnemonic } from "@/lib/stacks/wallet-from-mnemonic"
import { getStacksNetworkName } from "@/lib/stacks/network"

export type CustodialWalletMaterial = {
    stxAddress: string
    publicKey: string
    encryptedMnemonic: string
    kmsKeyVersion: string
    network: string
}

/** Generate + encrypt a custodial Stacks wallet. Persistence is handled by the API. */
export async function createCustodialWalletMaterial(
    userId: string
): Promise<CustodialWalletMaterial> {
    const network = getStacksNetworkName()
    const mnemonic = randomSeedPhrase(256)
    const account = await deriveCustodialAccountFromMnemonic(mnemonic)
    const encrypted = await encryptWithKms(mnemonic, mnemonicAad(userId, network))

    return {
        stxAddress: account.stxAddress,
        publicKey: account.publicKey,
        encryptedMnemonic: encrypted.ciphertext,
        kmsKeyVersion: encrypted.kmsKeyVersion,
        network,
    }
}
