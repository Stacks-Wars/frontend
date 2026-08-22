"use client"

import Link from "next/link"
import { RiArrowLeftLine, RiCheckLine, RiFileCopyLine, RiLockLine } from "@remixicon/react"
import * as React from "react"

import { LobbyStatusBadge } from "@/components/common/status-badge"
import { UserChip } from "@/components/common/user-chip"
import { Badge, Button, ButtonLink } from "@/components/ui"
import { useUserCards } from "@/hooks/use-user-cards"
import type { GameMetadata, Lobby } from "@/lib/api/types"
import { formatUsdc, timeAgo } from "@/lib/format"

export function RoomHeader({
    lobby,
    game,
    online,
}: {
    lobby: Lobby
    game?: GameMetadata | null
    online: number
}) {
    const { get } = useUserCards([lobby.creatorId])
    const [copied, setCopied] = React.useState(false)

    async function copyLink() {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1600)
    }

    return (
        <header className="space-y-4 rounded-2xl border border-border/70 p-5 surface-raised sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0 space-y-2">
                    <ButtonLink
                        href="/lobbies"
                        variant="ghost"
                        size="sm"
                        className="-ml-3 text-muted-foreground"
                    >
                        <RiArrowLeftLine />
                        All lobbies
                    </ButtonLink>

                    <div className="flex flex-wrap items-center gap-2">
                        <h1 className="font-display text-2xl sm:text-3xl">
                            {lobby.name}
                        </h1>
                        <LobbyStatusBadge status={lobby.status} />
                        {lobby.isPrivate ? (
                            <Badge variant="outline">
                                <RiLockLine />
                                Private
                            </Badge>
                        ) : null}
                        {lobby.isSponsored ? (
                            <Badge variant="gold">Sponsored</Badge>
                        ) : null}
                    </div>

                    <p className="text-sm text-muted-foreground">
                        <Link
                            href={`/games/${lobby.gameId}`}
                            className="hover:text-foreground"
                        >
                            {game?.name ?? lobby.gameId}
                        </Link>
                        <span className="mx-1.5">·</span>
                        opened {timeAgo(lobby.createdAt)}
                        <span className="mx-1.5">·</span>
                        {online} watching
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={copyLink}>
                        {copied ? <RiCheckLine /> : <RiFileCopyLine />}
                        {copied ? "Copied" : "Invite"}
                    </Button>
                </div>
            </div>

            {lobby.description ? (
                <p className="max-w-2xl text-sm text-muted-foreground">
                    {lobby.description}
                </p>
            ) : null}

            <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border/60 pt-4">
                <Figure label="Entry" value={formatUsdc(lobby.entryAmountMicro)} />
                <Figure
                    label="Pot"
                    value={formatUsdc(lobby.potMicro, { zero: "—" })}
                    tone="gold"
                />
                <Figure
                    label="Lobby"
                    value={
                        game
                            ? `${lobby.participants.length}/${game.maxPlayers}`
                            : String(lobby.participants.length)
                    }
                />
                <div className="space-y-1">
                    <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                        Host
                    </dt>
                    <dd>
                        <UserChip user={get(lobby.creatorId)} size="xs" />
                    </dd>
                </div>
            </dl>
        </header>
    )
}

function Figure({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone?: "gold"
}) {
    return (
        <div className="space-y-1">
            <dt className="text-[11px] tracking-wide text-muted-foreground uppercase">
                {label}
            </dt>
            <dd
                className={`font-display text-lg ${tone === "gold" ? "text-gold" : ""}`}
            >
                {value}
            </dd>
        </div>
    )
}
