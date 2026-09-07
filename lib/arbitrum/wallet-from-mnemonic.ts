import "server-only"

import { mnemonicToAccount, type LocalAccount } from "viem/accounts"

import { getArbitrumNetworkName } from "@/lib/arbitrum/network"

/** MetaMask / Ethereum default first account. */
export const ARBITRUM_DERIVATION_PATH = "m/44'/60'/0'/0/0" as const

export function deriveArbitrumAccountFromMnemonic(mnemonic: string): LocalAccount {
    return mnemonicToAccount(mnemonic.trim(), { path: ARBITRUM_DERIVATION_PATH })
}

export function deriveArbitrumWalletFromMnemonic(mnemonic: string) {
    const account = deriveArbitrumAccountFromMnemonic(mnemonic)
    return {
        address: account.address,
        publicKey: account.address,
        account,
        network: getArbitrumNetworkName(),
    }
}
