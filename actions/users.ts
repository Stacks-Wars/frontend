"use server"

import { upsertAppUser } from "@/lib/api/server"
import { auth } from "@/lib/auth/server"
import { AccountDeleteError, type DeleteAccountResult } from "@/lib/api/account-delete"
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

    return user
}

export async function acceptLegalTerms(version: string) {
    const { acceptLegal } = await import("@/lib/api/server")
    return acceptLegal(version)
}

export async function updateUserPreferences(payload: {
    lobbyAlertsEnabled?: boolean
    currentChain?: import("@/lib/chain").ChainId
}) {
    const { updatePreferences } = await import("@/lib/api/server")
    return updatePreferences(payload)
}

export async function saveUserPushSubscription(payload: {
    endpoint: string
    keys: { p256dh: string; auth: string }
    userAgent?: string
}) {
    const { savePushSubscription } = await import("@/lib/api/server")
    return savePushSubscription(payload)
}

export async function removeUserPushSubscription(endpoint: string) {
    const { deletePushSubscription } = await import("@/lib/api/server")
    return deletePushSubscription(endpoint)
}

export async function deleteMyAccount(): Promise<DeleteAccountResult> {
    const { deleteAppAccount } = await import("@/lib/api/server")
    try {
        await deleteAppAccount()
        return { ok: true }
    } catch (err) {
        if (err instanceof AccountDeleteError) {
            return {
                ok: false,
                code: err.code,
                availableMicro: err.availableMicro,
                pendingClaimMicro: err.pendingClaimMicro,
                error: err.message,
            }
        }
        throw err
    }
}

export async function getCurrentUser() {
    const { data: session } = await auth.getSession()

    if (!session?.user?.email || !(session.user as { id?: string }).id) {
        throw new Error("You must be signed in.")
    }

    return syncAuthUser(session.user as SessionUser)
}
