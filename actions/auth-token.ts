"use server"

import { getAccessToken } from "@/lib/auth/access-token"

/** Client-callable wrapper for WS auth frames. */
export async function getAccessTokenAction(): Promise<string> {
    return getAccessToken()
}
