"use client"

import * as React from "react"

import { syncAuthUser } from "@/actions/users"
import { authClient } from "@/lib/auth/client"
import { useUserStore } from "@/store/user"

export function AuthSync() {
    const { data: session, isPending } = authClient.useSession()
    const setUser = useUserStore((state) => state.setUser)
    const setLoading = useUserStore((state) => state.setLoading)

    React.useEffect(() => {
        let cancelled = false

        async function sync() {
            if (isPending) {
                return
            }

            if (!session?.user?.email) {
                if (!cancelled) {
                    setUser(null)
                    setLoading(false)
                }
                return
            }

            setLoading(true)

            try {
                const user = await syncAuthUser(session.user)
                if (!cancelled) {
                    setUser(user)
                }
            } catch (error) {
                console.error("Failed to sync app user", error)
                if (!cancelled) {
                    setUser(null)
                }
            } finally {
                if (!cancelled) {
                    setLoading(false)
                }
            }
        }

        void sync()

        return () => {
            cancelled = true
        }
    }, [isPending, session?.user, setLoading, setUser])

    return null
}
