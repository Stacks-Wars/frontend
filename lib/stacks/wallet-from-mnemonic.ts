import { mnemonicToSeedSync } from "@scure/bip39"
import { HDKey } from "@scure/bip32"
import {
    deriveAccount,
    deriveSalt,
    DerivationType,
    getStxAddress,
    selectStxDerivation,
} from "@stacks/wallet-sdk"
import { getPublicKeyFromPrivate } from "@stacks/encryption"

import { getStacksNetworkName } from "@/lib/stacks/network"

export async function deriveCustodialAccountFromMnemonic(mnemonic: string) {
    const network = getStacksNetworkName()
    const seed = mnemonicToSeedSync(mnemonic)
    const rootNode = HDKey.fromMasterSeed(seed)
    const salt = await deriveSalt(rootNode as never)
    const { stxDerivationType } = await selectStxDerivation({
        rootNode: rootNode as never,
        index: 0,
        network,
    })
    const account = deriveAccount({
        rootNode: rootNode as never,
        index: 0,
        salt,
        stxDerivationType: stxDerivationType as
            DerivationType.Wallet | DerivationType.Data,
    })

    const stxAddress = getStxAddress(account, network)
    return {
        address: stxAddress,
        stxAddress,
        stxPrivateKey: account.stxPrivateKey,
        publicKey: getPublicKeyFromPrivate(account.stxPrivateKey),
        network,
    }
}
