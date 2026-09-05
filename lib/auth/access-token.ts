"use server"

import { headers } from "next/headers"

import { auth } from "@/lib/auth/server"

/**
 * Better Auth JWT for Rust API / WS (EdDSA, ~15m expiry).
 */
export async function getAccessToken(): Promise<string> {
    const requestHeaders = await headers()
    const result = await auth.api.getToken({
        headers: requestHeaders,
    })

    const token =
        result && typeof result === "object" && "token" in result
            ? (result as { token?: string }).token
            : undefined

    if (!token) {
        throw new Error("Sign in required (no JWT).")
    }
    return token
}
