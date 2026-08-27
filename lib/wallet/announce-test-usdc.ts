"use client"

import { formatUsdc } from "@/lib/format"
import { useNotificationsStore } from "@/stores/notifications"
import { usePushStore } from "@/stores/push"

const TITLE = "$50 test USDC landed"
const BODY = "It's in your Solana wallet."

/** In-app notice + OS banner when web-push is not already handling it. */
export function announceTestUsdc(amountMicro: number) {
    const amount = formatUsdc(amountMicro, { zero: "$50.00" })
    const body = `${amount} is in your Solana wallet.`
    const { toast, push } = useNotificationsStore.getState().actions
    toast({ title: TITLE, body, tone: "success" })
    push({ title: TITLE, body, href: "/wallet" })

    if (typeof window === "undefined" || !("Notification" in window)) return
    if (Notification.permission !== "granted") return
    if (usePushStore.getState().enabled) return
    try {
        new Notification(TITLE, { body })
    } catch {
        /* ignore unsupported constructors */
    }
}
