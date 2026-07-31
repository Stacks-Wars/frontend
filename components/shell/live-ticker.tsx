"use client"

import { useQuery } from "@tanstack/react-query"

import { listGameActivityAction } from "@/actions/games"
import { LiveNumber } from "@/components/common/live-number"
import { LiveDot } from "@/components/ui"
import { useGameActivity } from "@/hooks/use-game-activity"
import { cn } from "@/lib/utils"

/**
 * Platform-wide player count in the header. Seeded once over HTTP, then driven
 * by `games.activity` broadcasts.
 */
export function LiveTicker({ className }: { className?: string }) {
    const { data } = useQuery({
        queryKey: ["game-activity"],
        queryFn: () => listGameActivityAction(),
        staleTime: 5 * 60_000,
    })
    const { totals } = useGameActivity(data ?? [])

    return (
        <span
            className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border/70 bg-surface/60 px-3 py-1.5 text-xs",
                className
            )}
        >
            <LiveDot />
            <LiveNumber value={totals.activePlayers} className="font-medium" />
            <span className="text-muted-foreground">playing</span>
            {totals.liveLobbies > 0 ? (
                <>
                    <span className="text-border-strong">·</span>
                    <LiveNumber
                        value={totals.liveLobbies}
                        className="font-medium"
                    />
                    <span className="text-muted-foreground">live</span>
                </>
            ) : null}
        </span>
    )
}
