import { randomSeedPhrase } from "@stacks/wallet-sdk"

import { encryptWithKms } from "@/lib/kms/envelope"
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
export async function createCustodialWalletMaterial(): Promise<CustodialWalletMaterial> {
    const mnemonic = randomSeedPhrase(256)
    const account = await deriveCustodialAccountFromMnemonic(mnemonic)
    const encrypted = await encryptWithKms(mnemonic)

    return {
        stxAddress: account.stxAddress,
        publicKey: account.publicKey,
        encryptedMnemonic: encrypted.ciphertext,
        kmsKeyVersion: encrypted.kmsKeyVersion,
        network: getStacksNetworkName(),
    }
}
