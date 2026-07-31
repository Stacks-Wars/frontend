"use client"

import {
    RiCheckLine,
    RiCloseCircleLine,
    RiTimeLine,
    RiVipCrownLine,
} from "@remixicon/react"

import { UserChip } from "@/components/common/user-chip"
import { Badge, Button } from "@/components/ui"
import type { GameMetadata, PlayerState } from "@/lib/api/types"
import { cn } from "@/lib/utils"

export function PlayerList({
    players,
    presence,
    selfUserId,
    creatorId,
    game,
    canKick,
    kicking,
    onKick,
}: {
    players: PlayerState[]
    presence: string[]
    selfUserId: string | null
    creatorId: string
    game?: GameMetadata | null
    canKick: boolean
    kicking: string | null
    onKick: (userId: string) => void
}) {
    const online = new Set(presence)
    const capacity = game?.maxPlayers ?? players.length
    const empty = Math.max(0, capacity - players.length)

    return (
        <div className="grid gap-3 sm:grid-cols-2">
            {players.map((player, index) => {
                const isSelf = player.userId === selfUserId
                const isHost = player.userId === creatorId

                return (
                    <div
                        key={player.userId}
                        className={cn(
                            "stagger flex animate-rise-in items-center gap-3 rounded-xl border p-3 transition-colors",
                            player.ready
                                ? "border-success/40 bg-success/5"
                                : "border-border/70 surface-raised"
                        )}
                        style={{ "--index": index } as React.CSSProperties}
                    >
                        <span className="relative">
                            <UserChip
                                user={player}
                                size="sm"
                                subtitle={
                                    isHost
                                        ? "Host"
                                        : player.ready
                                          ? "Ready"
                                          : "Not ready"
                                }
                            />
                            <span
                                className={cn(
                                    "absolute -bottom-0.5 left-6 size-2.5 rounded-full ring-2 ring-card",
                                    online.has(player.userId)
                                        ? "bg-success"
                                        : "bg-muted-foreground/60"
                                )}
                                aria-label={
                                    online.has(player.userId)
                                        ? "Connected"
                                        : "Away"
                                }
                            />
                        </span>

                        <div className="ml-auto flex items-center gap-1.5">
                            {isSelf ? <Badge variant="outline">You</Badge> : null}
                            {isHost ? (
                                <RiVipCrownLine
                                    className="size-4 text-gold"
                                    aria-label="Host"
                                />
                            ) : null}
                            {player.ready ? (
                                <RiCheckLine className="size-4 text-success" />
                            ) : (
                                <RiTimeLine className="size-4 text-muted-foreground" />
                            )}
                            {canKick && !isHost ? (
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    aria-label={`Remove ${player.username ?? "player"}`}
                                    disabled={kicking === player.userId}
                                    onClick={() => onKick(player.userId)}
                                    className="text-muted-foreground hover:text-destructive"
                                >
                                    <RiCloseCircleLine />
                                </Button>
                            ) : null}
                        </div>
                    </div>
                )
            })}

            {Array.from({ length: empty }).map((_, index) => (
                <div
                    key={`empty-${index}`}
                    className="flex items-center gap-3 rounded-xl border border-dashed border-border/70 p-3 text-sm text-muted-foreground"
                >
                    <span className="grid size-8 place-items-center rounded-full border border-dashed border-border">
                        <span className="text-xs">{players.length + index + 1}</span>
                    </span>
                    Waiting for a player
                </div>
            ))}
        </div>
    )
}
