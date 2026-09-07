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
import { chainAdapter, mintsPlayTokens, type ChainId } from "@/lib/chain"
import type { CustodialWallet, WalletBalance } from "@/lib/api/types"
import { syncAuthUser } from "@/actions/users"
import { getServerSession } from "@/lib/auth/session"
import { PLAY_CLAIM_MIN_MICRO, PLAY_MINT_MICRO } from "@/lib/chain/play"
import { fundArbitrumTestUsdc } from "@/lib/arbitrum/test-usdc"
import { fundSolanaTestUsdc } from "@/lib/solana/test-usdc"
import { fundStacksTestUsdc } from "@/lib/stacks/test-usdc"
import { waitForTx } from "@/lib/tx/wait-for-tx"

async function requireUser() {
    const session = await getServerSession()
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

/** Mint $50 play tokens when the wallet is under $1. */
export async function claimTestUsdc(
    chain: ChainId
): Promise<ClaimTestUsdcResult> {
    const user = await requireUser()
    const wallet = await getCustodialWallet(user.id, chain)
    if (!wallet) {
        throw new Error(
            `No ${chainAdapter(chain).label} wallet on this account yet.`
        )
    }

    const before = await getBalance(user.id, chain)
    if (BigInt(Math.max(0, before.availableMicro)) >= PLAY_CLAIM_MIN_MICRO) {
        return {
            minted: false,
            signature: null,
            amountMicro: 0,
            balance: before,
        }
    }
    if (!mintsPlayTokens(chain)) {
        return {
            minted: false,
            signature: null,
            amountMicro: 0,
            balance: before,
        }
    }

    let signature: string | null = null
    switch (chain) {
        case "solana":
            signature = await fundSolanaTestUsdc(wallet.address)
            break
        case "stacks":
            signature = await fundStacksTestUsdc(wallet.address)
            if (signature) {
                await waitForTx(signature)
            }
            break
        case "arbitrum":
            signature = await fundArbitrumTestUsdc(wallet.address)
            break
    }

    const balance = await refreshBalance(user.id, chain)
    const amountMicro = Number(PLAY_MINT_MICRO)
    if (signature) {
        try {
            await sendPushNotice({
                title: "Play wallet funded",
                body: "It's in your play wallet.",
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
