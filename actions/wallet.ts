"use server"

import { syncAuthUser } from "@/actions/users"
import {
    completeWithdrawal,
    getBalance,
    listWalletActivity,
    prepareWithdrawal,
    refreshBalance,
} from "@/lib/api/server"
import type { ChainActivityItem, CustodialWallet, WalletBalance } from "@/lib/api/types"
import { auth } from "@/lib/auth/server"
import { getCustodialWallet } from "@/lib/api/server"
import {
    MAX_WITHDRAW_MICRO,
    MIN_WITHDRAW_MICRO,
} from "@/lib/vault/config"
import { broadcastUsdcxTransfer } from "@/lib/wallet/withdraw-transfer"

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

export async function getMyBalance(): Promise<WalletBalance> {
    const user = await requireUser()
    return getBalance(user.id)
}

export async function getMyDepositWallet(): Promise<CustodialWallet | null> {
    const user = await requireUser()
    return getCustodialWallet(user.id)
}

export async function getMyActivity(): Promise<ChainActivityItem[]> {
    const user = await requireUser()
    return listWalletActivity(user.id)
}

/** User-triggered: bust Redis cache and re-read Hiro FT balance. */
export async function refreshMyBalance(): Promise<WalletBalance> {
    const user = await requireUser()
    return refreshBalance(user.id)
}

export async function withdrawAction(input: {
    amountUsd: number
    toAddress?: string
}): Promise<{ txid: string; balance: WalletBalance }> {
    const user = await requireUser()
    const amountMicro = Math.round(input.amountUsd * 1_000_000)
    if (amountMicro < MIN_WITHDRAW_MICRO) {
        throw new Error("Minimum withdrawal is $1.")
    }
    if (amountMicro > MAX_WITHDRAW_MICRO) {
        throw new Error("Maximum withdrawal is $10,000.")
    }

    const prepared = await prepareWithdrawal({
        amountMicro,
        toAddress: input.toAddress,
    })

    try {
        const txid = await broadcastUsdcxTransfer({
            userId: user.id,
            amountMicro: prepared.amountMicro,
            toAddress: prepared.toAddress,
            usdcxContract: prepared.usdcxContract,
        })
        const balance = await completeWithdrawal({
            txid,
        })
        return { txid, balance }
    } catch (err) {
        // Lock TTL will expire; rethrow for UI.
        throw err
    }
}
