import { cookies } from "next/headers"

import { auth } from "@/lib/auth/server"
import { CHAIN_COOKIE } from "@/lib/chain/storage"
import { parseChainId, type ChainId } from "@/lib/chain/types"

export async function currentChainFromCookie(): Promise<ChainId> {
    const jar = await cookies()
    return parseChainId(jar.get(CHAIN_COOKIE)?.value)
}

/**
 * Signed-in SSR lists the cookie chain. Guests omit `chain` so the API
 * returns paid lobbies on every settlement chain (free already list everywhere).
 */
export async function lobbyListChainForSession(): Promise<ChainId | undefined> {
    const { data } = await auth.getSession()
    if (!data?.user?.email) return undefined
    return currentChainFromCookie()
}
