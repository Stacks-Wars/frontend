"use server"

import { getCurrentUser } from "@/actions/users"
import { checkUsernameAvailable, updateAppUser } from "@/lib/api/server"
import type { AppUser } from "@/lib/api/types"

/**
 * The API PATCH is a COALESCE update: a `null` field is left untouched, so only
 * the keys the caller actually supplied are forwarded.
 */
export async function updateMyProfileAction(payload: {
    username?: string | null
    displayName?: string | null
    avatarUrl?: string | null
}): Promise<AppUser> {
    const user = await getCurrentUser()

    return updateAppUser(user.id, {
        username: payload.username ?? null,
        displayName: payload.displayName ?? null,
        avatarUrl: payload.avatarUrl ?? null,
    })
}

export async function checkUsernameAvailableAction(
    username: string
): Promise<{ available: boolean; reason?: string; username?: string }> {
    return checkUsernameAvailable(username.trim().toLowerCase())
}
