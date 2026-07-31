"use client"

import Link from "next/link"
import { RiLockLine, RiSparkling2Line } from "@remixicon/react"

import { LobbyStatusBadge } from "@/components/common/status-badge"
import { Badge, Button, Progress } from "@/components/ui"
import type { GameMetadata, Lobby } from "@/lib/api/types"
import { formatUsdc, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

export function LobbyCard({
    lobby,
    game,
    index = 0,
    showGame = true,
}: {
    lobby: Lobby
    game?: GameMetadata
    index?: number
    showGame?: boolean
}) {
    const players = lobby.participants.length
    const capacity = game?.maxPlayers ?? Math.max(players, 2)
    const full = players >= capacity
    const joinable = lobby.status === "waiting" && !full

    return (
        <article
            className="stagger flex animate-rise-in flex-col gap-4 rounded-2xl border border-border/70 p-4 transition-colors surface-raised hover:border-border-strong"
            style={{ "--index": index } as React.CSSProperties}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-1.5">
                        <Link
                            href={`/room/${lobby.path}`}
                            className="truncate font-display text-base hover:text-primary"
                        >
                            {lobby.name}
                        </Link>
                        {lobby.isPrivate ? (
                            <RiLockLine
                                className="size-3.5 shrink-0 text-muted-foreground"
                                aria-label="Private"
                            />
                        ) : null}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                        {showGame ? (
                            <>
                                <Link
                                    href={`/games/${lobby.gameId}`}
                                    className="hover:text-foreground"
                                >
                                    {game?.name ?? lobby.gameId}
                                </Link>
                                <span className="mx-1.5">·</span>
                            </>
                        ) : null}
                        {timeAgo(lobby.createdAt)}
                    </p>
                </div>
                <LobbyStatusBadge status={lobby.status} />
            </div>

            {lobby.description ? (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {lobby.description}
                </p>
            ) : null}

            <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                        {players}/{capacity} players
                    </span>
                    {lobby.isSponsored ? (
                        <Badge variant="gold">
                            <RiSparkling2Line />
                            Sponsored
                        </Badge>
                    ) : null}
                </div>
                <Progress
                    value={(players / capacity) * 100}
                    className={cn(full && "opacity-60")}
                />
            </div>

            <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3">
                <div>
                    <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        {lobby.entryAmountMicro > 0 ? "Entry" : "Stake"}
                    </p>
                    <p className="font-display text-base">
                        {formatUsdc(lobby.entryAmountMicro)}
                    </p>
                </div>
                {lobby.potMicro > 0 ? (
                    <div className="text-right">
                        <p className="text-[11px] tracking-wide text-muted-foreground uppercase">
                            Pot
                        </p>
                        <p className="font-display text-base text-gold">
                            {formatUsdc(lobby.potMicro, { zero: "$0" })}
                        </p>
                    </div>
                ) : null}
                <Button
                    size="sm"
                    variant={joinable ? "primary" : "outline"}
                    render={<Link href={`/room/${lobby.path}`} />}
                >
                    {joinable
                        ? lobby.isPrivate
                            ? "Request"
                            : "Join"
                        : lobby.status === "inProgress"
                          ? "Watch"
                          : "Open"}
                </Button>
            </div>
        </article>
    )
}
