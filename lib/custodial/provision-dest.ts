import "server-only"

import { createCustodialWalletMaterial } from "@/lib/custodial/wallets"
import { createCustodialWalletInternal } from "@/lib/api/server"
import type { ChainId } from "@/lib/chain"

/**
 * Create a custodial wallet for another user on this chain (game dest fee).
 * Idempotent: an existing row is returned instead of inserting again.
 */
export async function provisionDestWallet(
    userId: string,
    chain: ChainId
): Promise<string> {
    const material = await createCustodialWalletMaterial(userId, chain)
    const wallet = await createCustodialWalletInternal(userId, material)
    return wallet.address
}
