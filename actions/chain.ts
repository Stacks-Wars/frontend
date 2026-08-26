"use server"

import { createCustodialWalletMaterial } from "@/lib/custodial/wallets"
import {
    createCustodialWallet,
    getBalance,
    getCustodialWallet,
    updatePreferences,
} from "@/lib/api/server"
import { chainAdapter, type ChainId } from "@/lib/chain"
import type { WalletBalance } from "@/lib/api/types"
import { syncAuthUser } from "@/actions/users"
import { auth } from "@/lib/auth/server"
import { fundSolanaTestUsdc } from "@/lib/solana/test-usdc"

async function requireUser() {
    const { data: session } = await auth.getSession()
    if (!session?.user?.email || !(session.user as { id?: string }).id) {
        throw new Error("Sign in required.")
    }
    return syncAuthUser(
        session.user as {
            id: string
            email: string
            name?: string | null
            image?: string | null
            emailVerified?: boolean | string | Date | null
        }
    )
}

/** Provision the custodial wallet for `chain` if missing, then return its balance. */
export async function ensureChainWallet(
    chain: ChainId
): Promise<WalletBalance> {
    const user = await requireUser()
    const existing = await getCustodialWallet(user.id, chain)
    let address =
        existing && chainAdapter(chain).parseAddress(existing.address)
            ? existing.address
            : undefined
    if (!address) {
        const material = await createCustodialWalletMaterial(user.id, chain)
        await createCustodialWallet(user.id, material)
        address = material.address
    }
    if (chain === "solana" && address) {
        try {
            await fundSolanaTestUsdc(address)
        } catch (error) {
            console.error("[solana] test USDC mint failed", error)
        }
    }
    const balance = await getBalance(user.id, chain)
    try {
        await updatePreferences({ currentChain: chain })
    } catch {
        // Push targeting is best-effort; switching still works.
    }
    return balance
}
