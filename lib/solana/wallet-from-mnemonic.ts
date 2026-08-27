import "server-only"

import { mnemonicToSeedSync } from "@scure/bip39"
import { derivePath } from "ed25519-hd-key"
import {
    createKeyPairFromPrivateKeyBytes,
    getAddressFromPublicKey,
} from "@solana/kit"

import { getSolanaNetworkName } from "@/lib/solana/network"

/** Phantom / Solana CLI default: first account, no change index. */
export const SOLANA_DERIVATION_PATH = "m/44'/501'/0'/0'"

export async function deriveSolanaAccountFromMnemonic(mnemonic: string) {
    const seed = mnemonicToSeedSync(mnemonic)
    const { key } = derivePath(
        SOLANA_DERIVATION_PATH,
        Buffer.from(seed).toString("hex")
    )
    const keypair = await createKeyPairFromPrivateKeyBytes(Uint8Array.from(key))
    const address = await getAddressFromPublicKey(keypair.publicKey)

    return {
        address,
        publicKey: address,
        privateKeyBytes: Uint8Array.from(key),
        network: getSolanaNetworkName(),
    }
}
