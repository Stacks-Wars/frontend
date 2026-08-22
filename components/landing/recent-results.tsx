"use client"

import Link from "next/link"
import * as React from "react"

import { SectionHeader } from "@/components/common/section"
import { UserChip } from "@/components/common/user-chip"
import { EmptyState } from "@/components/ui"
import { useUserCards } from "@/hooks/use-user-cards"
import type { GameMetadata, RecentMatch } from "@/lib/api/types"
import { formatUsdc, timeAgo } from "@/lib/format"
import { useRecentResults } from "@/stores/live"

type Row = {
    key: string
    lobbyPath: string
    gameId: string
    potMicro: number
    playerCount: number | null
    finishedAt: string | null
    winnerId: string | null
    winner: {
        id?: string
        userId?: string
        username: string | null
        displayName: string | null
        avatarUrl: string | null
    } | null
    prizeMicro: number | null
}

/**
 * Seeded from the API, then prepended with matches that finish while the page
 * is open. Live rows arrive with only a winner id, so names are resolved from
 * the user-card cache.
 */
export function RecentResults({
    initial,
    games,
}: {
    initial: RecentMatch[]
    games: GameMetadata[]
}) {
    const live = useRecentResults()
    const gameName = React.useCallback(
        (id: string) => games.find((game) => game.id === id)?.name ?? id,
        [games]
    )

    const seeded = new Set(initial.map((match) => match.matchId))
    const fresh = live.filter((result) => !seeded.has(result.matchId))
    const { get } = useUserCards(
        fresh.map((result) => result.winners[0]).filter(Boolean)
    )

    const rows: Row[] = [
        ...fresh.map((result) => ({
            key: result.matchId,
            lobbyPath: result.lobbyPath,
            gameId: result.gameId,
            potMicro: result.potMicro,
            playerCount: null,
            finishedAt: null,
            winnerId: result.winners[0] ?? null,
            winner: result.winners[0] ? get(result.winners[0]) : null,
            prizeMicro: null,
        })),
        ...initial.map((match) => ({
            key: match.matchId,
            lobbyPath: match.lobbyPath,
            gameId: match.gameId,
            potMicro: match.potMicro,
            playerCount: match.playerCount,
            finishedAt: match.finishedAt,
            winnerId: match.winnerId,
            winner: match.winnerId
                ? {
                      userId: match.winnerId,
                      username: match.winnerUsername,
                      displayName: match.winnerDisplayName,
                      avatarUrl: match.winnerAvatarUrl,
                  }
                : null,
            prizeMicro: match.winnerPrizeMicro,
        })),
    ].slice(0, 8)

    return (
        <section className="space-y-4">
            <SectionHeader
                title="Latest results"
                description="Matches settle here as they finish."
            />

            {rows.length === 0 ? (
                <EmptyState
                    title="No results yet"
                    description="Finish a match and it shows up here for everyone."
                />
            ) : (
                <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/70 surface-raised">
                    {rows.map((row, index) => (
                        <li
                            key={row.key}
                            className="stagger flex animate-rise-in items-center gap-3 px-4 py-2.5"
                            style={{ "--index": index } as React.CSSProperties}
                        >
                            {row.winner ? (
                                <UserChip
                                    user={row.winner}
                                    size="xs"
                                    subtitle={`${gameName(row.gameId)}${
                                        row.finishedAt
                                            ? ` · ${timeAgo(row.finishedAt)}`
                                            : " · just now"
                                    }`}
                                />
                            ) : (
                                <span className="text-sm text-muted-foreground">
                                    {gameName(row.gameId)}
                                </span>
                            )}

                            <span className="ml-auto shrink-0 text-right">
                                <span className="block font-display text-sm text-gold">
                                    {formatUsdc(
                                        row.prizeMicro ?? row.potMicro,
                                        { zero: "free" }
                                    )}
                                </span>
                                <Link
                                    href={`/room/${row.lobbyPath}`}
                                    className="block text-xs text-muted-foreground hover:text-foreground"
                                >
                                    view
                                </Link>
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}
