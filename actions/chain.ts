"use server"

import { createCustodialWalletMaterial } from "@/lib/custodial/wallets"
import {
    createCustodialWallet,
    getBalance,
    getCustodialWallet,
    listCustodialWallets,
    refreshBalance,
    sendPushNotice,
    updatePreferences,
} from "@/lib/api/server"
import { chainAdapter, type ChainId } from "@/lib/chain"
import type { CustodialWallet, WalletBalance } from "@/lib/api/types"
import { syncAuthUser } from "@/actions/users"
import { auth } from "@/lib/auth/server"
import { fundSolanaTestUsdc } from "@/lib/solana/test-usdc"
import {
    SOLANA_CLAIM_MIN_AMOUNT,
    SOLANA_TEST_USDC_AMOUNT,
} from "@/lib/solana/network"

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

export async function listMyWallets(): Promise<CustodialWallet[]> {
    const user = await requireUser()
    return listCustodialWallets(user.id)
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
    const balance = await getBalance(user.id, chain)
    try {
        await updatePreferences({ currentChain: chain })
    } catch {
        // Push targeting is best-effort; switching still works.
    }
    return balance
}

export type ClaimTestUsdcResult = {
    minted: boolean
    signature: string | null
    amountMicro: number
    balance: WalletBalance
}

/**
 * Mint $50 of our Solana Devnet USDC when the wallet is under $1.
 * Waits for confirmation, refreshes balance, and fans out a web-push.
 */
export async function claimSolanaTestUsdc(): Promise<ClaimTestUsdcResult> {
    const user = await requireUser()
    const wallet = await getCustodialWallet(user.id, "solana")
    if (!wallet) {
        throw new Error("No Solana wallet on this account yet.")
    }

    const before = await getBalance(user.id, "solana")
    if (BigInt(Math.max(0, before.availableMicro)) >= SOLANA_CLAIM_MIN_AMOUNT) {
        return {
            minted: false,
            signature: null,
            amountMicro: 0,
            balance: before,
        }
    }

    const signature = await fundSolanaTestUsdc(wallet.address)
    const balance = await refreshBalance(user.id, "solana")
    const amountMicro = Number(SOLANA_TEST_USDC_AMOUNT)
    if (signature) {
        try {
            await sendPushNotice({
                title: "$50 test USDC landed",
                body: "It's in your Solana wallet.",
                path: "/wallet",
            })
        } catch {
            // Web push is best-effort.
        }
    }
    return {
        minted: Boolean(signature),
        signature,
        amountMicro: signature ? amountMicro : 0,
        balance,
    }
}
