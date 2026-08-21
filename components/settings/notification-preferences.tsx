"use client"

import * as React from "react"

import { updateUserPreferences } from "@/actions/users"
import { Label, Switch } from "@/components/ui"
import { usePushStore } from "@/stores/push"
import { useSessionStore } from "@/stores/session"

export function NotificationPreferences() {
    const user = useSessionStore((s) => s.user)
    const setUser = useSessionStore((s) => s.setUser)
    const enabled = usePushStore((s) => s.enabled)
    const enable = usePushStore((s) => s.enable)
    const disable = usePushStore((s) => s.disable)
    const [busy, setBusy] = React.useState(false)
    const [hint, setHint] = React.useState<string | null>(null)

    const lobbyAlerts = user?.lobbyAlertsEnabled !== false

    async function togglePush(next: boolean) {
        setBusy(true)
        setHint(null)
        try {
            if (next) {
                const ok = await enable()
                if (!ok) {
                    setHint(
                        "Permission was denied, or this browser needs the app installed on the Home Screen (iOS 16.4+)."
                    )
                }
            } else {
                await disable()
            }
        } catch (err) {
            setHint(err instanceof Error ? err.message : "Could not update push.")
        } finally {
            setBusy(false)
        }
    }

    async function toggleLobby(next: boolean) {
        setBusy(true)
        try {
            const updated = await updateUserPreferences({
                lobbyAlertsEnabled: next,
            })
            setUser(updated)
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="space-y-5 rounded-2xl border border-border/70 p-5 surface-raised">
            <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                    <Label className="text-sm font-medium">
                        Device notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                        Match results and winnings on this browser, including
                        desktop. On iPhone this only works after you add Stacks
                        Wars to the Home Screen.
                    </p>
                </div>
                <Switch
                    checked={enabled}
                    disabled={busy}
                    onCheckedChange={(on) => void togglePush(on)}
                />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border/60 pt-5">
                <div className="space-y-1">
                    <Label className="text-sm font-medium">Lobby alerts</Label>
                    <p className="text-xs text-muted-foreground">
                        Ping this device when a new public lobby opens. Default
                        on once push is enabled.
                    </p>
                </div>
                <Switch
                    checked={lobbyAlerts}
                    disabled={busy || !enabled}
                    onCheckedChange={(on) => void toggleLobby(on)}
                />
            </div>
            {hint ? (
                <p className="text-xs text-muted-foreground">{hint}</p>
            ) : null}
        </div>
    )
}
