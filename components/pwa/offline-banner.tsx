"use client"

import { useIsOffline } from "@/lib/offline"

export function OfflineBanner() {
    const offline = useIsOffline()
    if (!offline) return null

    return (
        <div
            role="status"
            className="border-b border-border/60 bg-warning/15 px-4 py-2 text-center text-sm text-warning-foreground"
        >
            You&rsquo;re offline. We&rsquo;ll retry when you&rsquo;re back.
        </div>
    )
}
