import "server-only"

import {
    CHAIN_IDS,
    chainAdapter,
    isEvmChain,
    type ChainId,
} from "@/lib/chain"
import {
    createCustodialWalletInternal,
    getSigningMaterialOrNull,
} from "@/lib/api/server"
import { rewrapEvmSigningMaterial } from "@/lib/custodial/unlock"
import {
    createCustodialWalletMaterial,
    type CustodialWalletMaterial,
} from "@/lib/custodial/wallets"
import { evmKeyCluster } from "@/lib/kms/envelope"

/**
 * Generate a chain wallet, or copy the shared EVM envelope from a sibling
 * in the same dest/prod cluster. Persistence is still the API.
 */
export async function provisionCustodialWalletMaterial(
    userId: string,
    chain: ChainId
): Promise<CustodialWalletMaterial> {
    if (!isEvmChain(chain)) {
        return createCustodialWalletMaterial(userId, chain)
    }

    const cluster = evmKeyCluster(chainAdapter(chain).playNetwork())
    for (const sibling of CHAIN_IDS) {
        if (!isEvmChain(sibling) || sibling === chain) continue
        const secret = await getSigningMaterialOrNull(userId, sibling)
        if (!secret) continue
        if (evmKeyCluster(secret.network) !== cluster) continue
        const reused = await rewrapEvmSigningMaterial(secret)
        return {
            address: reused.address,
            publicKey: reused.publicKey,
            encryptedSigningMaterial: reused.encryptedSigningMaterial,
            kmsKeyVersion: reused.kmsKeyVersion,
            network: chainAdapter(chain).playNetwork(),
            chain,
        }
    }

    return createCustodialWalletMaterial(userId, chain)
}

/**
 * Create a custodial wallet for another user on this chain (game dest fee).
 * Idempotent: an existing row is returned instead of inserting again.
 */
export async function provisionDestWallet(
    userId: string,
    chain: ChainId
): Promise<string> {
    const existing = await getSigningMaterialOrNull(userId, chain)
    if (existing) return existing.address
    const material = await provisionCustodialWalletMaterial(userId, chain)
    const wallet = await createCustodialWalletInternal(userId, material)
    return wallet.address
}
