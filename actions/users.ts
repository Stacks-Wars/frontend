"use server"

import { createCustodialWalletMaterial } from "@/lib/custodial/wallets"
import {
    createCustodialWallet,
    getCustodialWallet,
    upsertAppUser,
} from "@/lib/api/server"
import { auth } from "@/lib/auth/server"
import type { AppUser } from "@/lib/api/types"

type SessionUser = {
    id: string
    email: string
    name?: string | null
    image?: string | null
    emailVerified?: boolean | string | Date | null
}

function normalizeEmail(email: string) {
    return email.trim().toLowerCase()
}

function resolveEmailVerifiedAt(sessionUser: SessionUser) {
    const value = sessionUser.emailVerified
    if (value === true) {
        return new Date().toISOString()
    }
    if (typeof value === "string" && value.trim()) {
        return new Date(value).toISOString()
    }
    if (value instanceof Date) {
        return value.toISOString()
    }
    return null
}

/** Sync Neon Auth identity (`sub` = users.id) and provision custodial wallet. */
export async function syncAuthUser(sessionUser: SessionUser): Promise<AppUser> {
    if (!sessionUser.id?.trim()) {
        throw new Error("Neon Auth user id (sub) is required.")
    }
    const email = normalizeEmail(sessionUser.email)
    const displayName = sessionUser.name?.trim() || null
    const avatarUrl = sessionUser.image?.trim() || null
    const emailVerifiedAt = resolveEmailVerifiedAt(sessionUser)

    const user = await upsertAppUser({
        id: sessionUser.id,
        email,
        displayName,
        avatarUrl,
        emailVerifiedAt,
    })

    const existingWallet = await getCustodialWallet(user.id)
    if (!existingWallet) {
        const material = await createCustodialWalletMaterial()
        await createCustodialWallet(user.id, material)
    }

    return user
}

export async function getCurrentUser() {
    const { data: session } = await auth.getSession()

    if (!session?.user?.email || !(session.user as { id?: string }).id) {
        throw new Error("You must be signed in.")
    }

    return syncAuthUser(session.user as SessionUser)
}
