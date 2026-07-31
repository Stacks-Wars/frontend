"use client"

import { RiWifiOffLine } from "@remixicon/react"

import { useAppSocket } from "@/components/ws/app-ws-provider"
import { cn } from "@/lib/utils"

/**
 * Only visible when the socket is down. A permanent "connected" badge would be
 * noise; a missing connection is what the player needs to know about.
 */
export function ConnectionPill({ className }: { className?: string }) {
    const status = useAppSocket()
    if (status === "open") return null

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2.5 py-1 text-xs font-medium text-warning",
                className
            )}
        >
            <RiWifiOffLine className="size-3.5" />
            {status === "connecting" ? "Connecting" : "Reconnecting"}
        </span>
    )
}
