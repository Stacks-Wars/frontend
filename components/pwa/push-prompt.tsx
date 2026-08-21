"use client"

import { RiCloseLine, RiNotification3Line } from "@remixicon/react"
import * as React from "react"

import { Button } from "@/components/ui"
import { LEGAL_VERSION } from "@/lib/legal"
import { usePushStore } from "@/stores/push"
import { useSessionStore } from "@/stores/session"

export function PushPrompt() {
    const user = useSessionStore((s) => s.user)
    const loading = useSessionStore((s) => s.loading)
    const dismissed = usePushStore((s) => s.dismissed)
    const status = usePushStore((s) => s.status)
    const enablePush = usePushStore((s) => s.enable)
    const dismiss = usePushStore((s) => s.dismiss)
    const [busy, setBusy] = React.useState(false)

    const hydrated = React.useSyncExternalStore(
        (onStoreChange) =>
            usePushStore.persist.onFinishHydration(onStoreChange),
        () => usePushStore.persist.hasHydrated(),
        () => false
    )

    const needsLegal = Boolean(
        user &&
        (user.legalAcceptedAt == null || user.legalVersion !== LEGAL_VERSION)
    )

    const visible =
        hydrated &&
        Boolean(user) &&
        !loading &&
        !needsLegal &&
        !dismissed &&
        status === "default"

    async function onEnable() {
        setBusy(true)
        try {
            const ok = await enablePush()
            if (ok || usePushStore.getState().status !== "default") {
                dismiss()
            }
        } finally {
            setBusy(false)
        }
    }

    if (!visible) return null

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/70 p-4 shadow-xl surface-raised">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                        <RiNotification3Line className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-3">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">
                                Turn on notifications
                            </p>
                            <p className="text-xs text-muted-foreground">
                                Match results, winnings, and new lobbies on this
                                browser.
                            </p>
                        </div>
                        <Button
                            size="sm"
                            variant="primary"
                            disabled={busy}
                            onClick={() => void onEnable()}
                        >
                            {busy ? "Enabling…" : "Enable"}
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Dismiss"
                        onClick={dismiss}
                    >
                        <RiCloseLine />
                    </Button>
                </div>
            </div>
        </div>
    )
}
