"use client"

import * as React from "react"

import { getMyBalance } from "@/actions/wallet"
import { ensureChainWallet } from "@/actions/chain"
import { acceptLegalTerms, syncAuthUser, updateUserPreferences } from "@/actions/users"
import { LEGAL_VERSION } from "@/lib/legal"
import { authClient } from "@/lib/auth/client"
import { isEmailVerified, isVerificationDisabled } from "@/lib/auth/flags"
import { isWebPushSupported } from "@/lib/push"
import { usePushStore } from "@/stores/push"
import {
    clearAccessTokenCache,
    useUserTopic,
} from "@/components/ws/app-ws-provider"
import { appSocket } from "@/lib/ws/app-socket"
import { readStoredChain } from "@/lib/chain"
import { useSessionActions, useSessionUser } from "@/stores/session"

/**
 * Mirrors the auth session into the app: upserts the backend user record,
 * seeds the balance, and hands the socket a token once a session exists.
 */
export function AuthSync() {
    const { data: session, isPending } = authClient.useSession()
    const { setUser, setLoading, setBalance, hydrateCurrentChain } =
        useSessionActions()
    const userId = useSessionUser()?.id

    useUserTopic(userId)

    // The session object is a fresh identity on every render, so the sync is
    // driven by the fields it carries rather than the object itself.
    const id = session?.user?.id ?? null
    const email = session?.user?.email ?? null
    const name = session?.user?.name ?? null
    const image = session?.user?.image ?? null
    const emailVerified = session?.user?.emailVerified ?? null

    React.useEffect(() => {
        hydrateCurrentChain(readStoredChain())
    }, [hydrateCurrentChain])

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

            // Keep unverified email signups out of the app users table until OTP passes
            // (unless local DISABLE_VERIFICATION is set).
            if (
                !isVerificationDisabled() &&
                !isEmailVerified(emailVerified)
            ) {
                clearAccessTokenCache()
                setUser(null)
                setBalance(null)
                setLoading(false)
                return
            }

            setLoading(true)
            try {
                let synced = await syncAuthUser(current)
                try {
                    const intent = sessionStorage.getItem("sw-legal-intent")
                    if (
                        intent === LEGAL_VERSION &&
                        (synced.legalAcceptedAt == null ||
                            synced.legalVersion !== LEGAL_VERSION)
                    ) {
                        synced = await acceptLegalTerms(LEGAL_VERSION)
                        sessionStorage.removeItem("sw-legal-intent")
                    }
                } catch {
                    /* modal will catch remaining users */
                }
                if (cancelled) return
                setUser(synced)
                // The socket usually opens before the session exists.
                clearAccessTokenCache()
                appSocket.refreshAuth()

                try {
                    await updateUserPreferences({
                        currentChain: readStoredChain(),
                    })
                } catch {
                    // Push targeting is best-effort.
                }

                try {
                    const chain = readStoredChain()
                    const balance = await ensureChainWallet(chain)
                    if (!cancelled) setBalance(balance)
                } catch {
                    try {
                        const balance = await getMyBalance(readStoredChain())
                        if (!cancelled) setBalance(balance)
                    } catch {
                        // No wallet yet on a brand new account.
                    }
                }

                if (
                    isWebPushSupported() &&
                    Notification.permission === "granted"
                ) {
                    void usePushStore.getState().actions.enable()
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
