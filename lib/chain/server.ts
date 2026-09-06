import { cookies } from "next/headers"

import { getServerSession } from "@/lib/auth/session"
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
    try {
        const session = await getServerSession()
        if (!session?.user?.email) return undefined
        return currentChainFromCookie()
    } catch (error) {
        console.error("lobbyListChainForSession", error)
        return undefined
    }
}
