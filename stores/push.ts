"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

import {
    currentPushSubscription,
    isWebPushSupported,
    subscribeWebPush,
    unsubscribeWebPush,
} from "@/lib/push"

export type PushPermissionStatus =
    | "pending"
    | "default"
    | "granted"
    | "denied"
    | "unsupported"

type PushState = {
    dismissed: boolean
    status: PushPermissionStatus
    /** Live PushManager subscription on this device. */
    enabled: boolean
    evaluate: () => Promise<void>
    enable: () => Promise<boolean>
    disable: () => Promise<void>
    dismiss: () => void
}

export const usePushStore = create<PushState>()(
    persist(
        (set, get) => ({
            dismissed: false,
            status: "pending",
            enabled: false,
            evaluate: async () => {
                if (typeof window === "undefined" || !isWebPushSupported()) {
                    set({ status: "unsupported", enabled: false })
                    return
                }
                const permission = Notification.permission
                if (permission !== "granted") {
                    set({ status: permission, enabled: false })
                    return
                }
                const sub = await currentPushSubscription()
                set({ status: "granted", enabled: Boolean(sub) })
            },
            enable: async () => {
                const ok = await subscribeWebPush()
                if (ok) set({ status: "granted", enabled: true })
                await get().evaluate()
                return ok
            },
            disable: async () => {
                await unsubscribeWebPush()
                await get().evaluate()
            },
            dismiss: () => set({ dismissed: true }),
        }),
        {
            name: "sw-push-prompt",
            partialize: (state) => ({ dismissed: state.dismissed }),
            onRehydrateStorage: () => (state) => {
                void state?.evaluate()
            },
        }
    )
)
