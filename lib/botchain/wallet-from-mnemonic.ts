import "server-only"

import { mnemonicToAccount, type LocalAccount } from "viem/accounts"

import { getBotchainNetworkName } from "@/lib/botchain/network"

/** MetaMask / Ethereum default first account. Same path as other EVM chains. */
export const BOTCHAIN_DERIVATION_PATH = "m/44'/60'/0'/0/0" as const

export function deriveBotchainAccountFromMnemonic(mnemonic: string): LocalAccount {
    return mnemonicToAccount(mnemonic.trim(), { path: BOTCHAIN_DERIVATION_PATH })
}

export function deriveBotchainWalletFromMnemonic(mnemonic: string) {
    const account = deriveBotchainAccountFromMnemonic(mnemonic)
    return {
        address: account.address,
        publicKey: account.address,
        account,
        network: getBotchainNetworkName(),
    }
}
