"use client"

import { Avatar, AvatarFallback } from "@/components/ui"
import type { PlayerState } from "@/lib/api/types"
import { displayNameFor } from "@/lib/format"
import { cn } from "@/lib/utils"

export type RailPlayer = {
    userId: string
    name: string
    /** Right-hand figure: score, pawns home, pieces left. */
    detail?: string
    color?: string
    active?: boolean
    eliminated?: boolean
}

export function toRailPlayers(players: PlayerState[]): RailPlayer[] {
    return players.map((player) => ({
        userId: player.userId,
        name: displayNameFor(player),
    }))
}

export function PlayerRail({
    players,
    selfUserId,
    title = "Players",
}: {
    players: RailPlayer[]
    selfUserId: string | null
    title?: string
}) {
    return (
        <div className="rounded-xl border border-border/70 surface-raised">
            <p className="border-b border-border/60 px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {title}
            </p>
            <ul className="divide-y divide-border/40">
                {players.map((player) => (
                    <li
                        key={player.userId}
                        className={cn(
                            "flex items-center gap-2.5 px-3 py-2.5 transition-colors",
                            player.active && "bg-primary/10",
                            player.eliminated && "opacity-45"
                        )}
                    >
                        <span className="relative">
                            <Avatar size="xs">
                                <AvatarFallback seed={player.name} />
                            </Avatar>
                            {player.color ? (
                                <span
                                    className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full ring-2 ring-card"
                                    style={{ background: player.color }}
                                />
                            ) : null}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm">
                            {player.name}
                            {player.userId === selfUserId ? (
                                <span className="ml-1 text-xs text-muted-foreground">
                                    (you)
                                </span>
                            ) : null}
                        </span>
                        {player.detail ? (
                            <span className="tnum text-xs text-muted-foreground">
                                {player.detail}
                            </span>
                        ) : null}
                    </li>
                ))}
            </ul>
        </div>
    )
}
