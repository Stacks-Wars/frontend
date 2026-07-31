"use client"

import * as React from "react"

import { getMyBalance } from "@/actions/wallet"
import { syncAuthUser } from "@/actions/users"
import { authClient } from "@/lib/auth/client"
import {
    clearAccessTokenCache,
    useUserTopic,
} from "@/components/ws/app-ws-provider"
import { appSocket } from "@/lib/ws/app-socket"
import { useSessionStore } from "@/stores/session"

/**
 * Mirrors the auth session into the app: upserts the backend user record,
 * seeds the balance, and hands the socket a token once a session exists.
 */
export function AuthSync() {
    const { data: session, isPending } = authClient.useSession()
    const setUser = useSessionStore((state) => state.setUser)
    const setLoading = useSessionStore((state) => state.setLoading)
    const setBalance = useSessionStore((state) => state.setBalance)
    const userId = useSessionStore((state) => state.user?.id)

    useUserTopic(userId)

    // The session object is a fresh identity on every render, so the sync is
    // driven by the fields it carries rather than the object itself.
    const id = session?.user?.id ?? null
    const email = session?.user?.email ?? null
    const name = session?.user?.name ?? null
    const image = session?.user?.image ?? null
    const emailVerified = session?.user?.emailVerified ?? null

    React.useEffect(() => {
        if (isPending) return
        let cancelled = false

        async function sync() {
            const current =
                id && email ? { id, email, name, image, emailVerified } : null
            if (!current) {
                clearAccessTokenCache()
                setUser(null)
                setBalance(null)
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                const user = await syncAuthUser(current)
                if (cancelled) return
                setUser(user)
                // The socket usually opens before the session exists.
                clearAccessTokenCache()
                appSocket.refreshAuth()

                try {
                    const balance = await getMyBalance()
                    if (!cancelled) setBalance(balance)
                } catch {
                    // No wallet yet on a brand new account.
                }
            } catch (error) {
                console.error("Failed to sync app user", error)
                if (!cancelled) {
                    setUser(null)
                    setBalance(null)
                }
            } finally {
                if (!cancelled) setLoading(false)
            }
        }

        void sync()

        return () => {
            cancelled = true
        }
    }, [
        isPending,
        id,
        email,
        name,
        image,
        emailVerified,
        setBalance,
        setLoading,
        setUser,
    ])

    return null
}
