"use server"

import { auth } from "@/lib/auth/server"

/**
 * Neon Auth JWT for Rust API / WS (EdDSA, ~15m expiry).
 * Prefer `auth.token()`; fall back to session.token from getSession.
 */
export async function getAccessToken(): Promise<string> {
    const authApi = auth as typeof auth & {
        token?: () => Promise<{
            data?: { token?: string } | null
            error?: { message?: string } | null
        }>
    }

    if (typeof authApi.token === "function") {
        const { data, error } = await authApi.token()
        if (data?.token) return data.token
        if (error?.message) {
            throw new Error(error.message)
        }
    }

    const { data: session } = await auth.getSession()
    const token = (
        session as { session?: { token?: string }; token?: string } | null
    )?.session?.token
        ?? (session as { token?: string } | null)?.token

    if (!token) {
        throw new Error("Sign in required (no JWT).")
    }
    return token
}
