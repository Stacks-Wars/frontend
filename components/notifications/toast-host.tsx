"use client"

import { useNotificationsStore } from "@/stores/notifications"
import { cn } from "@/lib/utils"

export function ToastHost() {
    const toasts = useNotificationsStore((s) => s.toasts)
    const dismiss = useNotificationsStore((s) => s.dismissToast)

    if (!toasts.length) return null

    return (
        <div className="pointer-events-none fixed inset-x-0 top-16 z-50 flex flex-col items-center gap-2 px-4 md:top-4 md:items-end">
            {toasts.map((t) => (
                <button
                    key={t.id}
                    type="button"
                    onClick={() => dismiss(t.id)}
                    className={cn(
                        "pointer-events-auto w-full max-w-sm rounded-lg border px-4 py-3 text-left text-sm shadow-lg animate-hub-enter",
                        t.tone === "success" &&
                            "border-secondary/40 bg-card text-foreground",
                        t.tone === "danger" &&
                            "border-destructive/40 bg-card text-destructive",
                        (!t.tone || t.tone === "default") &&
                            "border-border bg-card text-foreground"
                    )}
                >
                    <p className="font-medium">{t.title}</p>
                    {t.body ? (
                        <p className="mt-0.5 text-muted-foreground">{t.body}</p>
                    ) : null}
                </button>
            ))}
        </div>
    )
}
