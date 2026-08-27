"use client"

import Link from "next/link"
import * as React from "react"
import { RiLockLine } from "@remixicon/react"

import { EmptyState } from "@/components/ui"
import type { Lobby } from "@/lib/api/types"
import { chainAdapter, parseChainId } from "@/lib/chain"
import { formatUsdc, timeAgo } from "@/lib/format"
import type { MatchFinishedPayload } from "@/lib/ws/protocol"
import { useRecentResults } from "@/stores/live"

const RECENT_LIMIT = 12

type FinishedRow = {
    key: string
    path: string
    name: string
    playerCount: number
    potMicro: number
    entryAmountMicro: number
    isPrivate: boolean
    chain?: string
    finishedAt: string
}

function fromLobby(lobby: Lobby): FinishedRow {
    return {
        key: lobby.id,
        path: lobby.path,
        name: lobby.name,
        playerCount: lobby.participants.length,
        potMicro: lobby.potMicro,
        entryAmountMicro: lobby.entryAmountMicro,
        isPrivate: lobby.isPrivate,
        chain: lobby.chain,
        finishedAt: lobby.updatedAt,
    }
}

function fromLive(result: MatchFinishedPayload): FinishedRow {
    return {
        key: result.lobbyId,
        path: result.lobbyPath,
        name: result.lobbyName?.trim() || result.lobbyPath,
        playerCount: result.playerCount ?? result.winners.length,
        potMicro: result.potMicro,
        entryAmountMicro: result.entryAmountMicro ?? 0,
        isPrivate: result.isPrivate ?? false,
        chain: result.chain,
        finishedAt: result.finishedAt ?? "",
    }
}

/**
 * Finished lobbies for one game. Seeded from `GET /lobbies?status=finished`,
 * then prepended with `match.finished` events that land while the page is open.
 */
export function FinishedLobbies({
    gameId,
    initial,
}: {
    gameId: string
    initial: Lobby[]
}) {
    const live = useRecentResults()

    const rows = React.useMemo(() => {
        const seen = new Set(initial.map((lobby) => lobby.id))
        const fresh: FinishedRow[] = []
        for (const result of live) {
            if (result.gameId !== gameId || seen.has(result.lobbyId)) continue
            seen.add(result.lobbyId)
            fresh.push(fromLive(result))
        }
        return [...fresh, ...initial.map(fromLobby)].slice(0, RECENT_LIMIT)
    }, [gameId, initial, live])

    if (rows.length === 0) {
        return (
            <EmptyState
                title="No finished lobbies yet"
                description="Host a match and it lands here when it settles."
            />
        )
    }

    return (
        <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/70 surface-raised">
            {rows.map((row) => {
                const players = row.playerCount
                const paid = row.entryAmountMicro > 0
                return (
                    <li key={row.key}>
                        <Link
                            href={`/room/${row.path}`}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                        >
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 font-display text-sm">
                                    <span className="truncate">{row.name}</span>
                                    {row.isPrivate ? (
                                        <RiLockLine
                                            className="size-3.5 shrink-0 text-muted-foreground"
                                            aria-label="Private"
                                        />
                                    ) : null}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    {players} {players === 1 ? "player" : "players"}
                                    {" · "}
                                    {row.finishedAt
                                        ? timeAgo(row.finishedAt)
                                        : "just now"}
                                    {" · "}
                                    {paid
                                        ? `${formatUsdc(row.entryAmountMicro)} entry`
                                        : "Free"}
                                    {paid ? (
                                        <>
                                            {" · "}
                                            {chainAdapter(parseChainId(row.chain)).label}
                                        </>
                                    ) : null}
                                </p>
                            </div>
                            <span className="ml-auto shrink-0 text-right">
                                <span className="block text-[11px] tracking-wide text-muted-foreground uppercase">
                                    Pot
                                </span>
                                <span className="font-display text-sm text-gold">
                                    {formatUsdc(row.potMicro, { zero: "—" })}
                                </span>
                            </span>
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}
