"use client"

import Link from "next/link"
import * as React from "react"
import { RiLoader4Line, RiSwordLine } from "@remixicon/react"

import { listUserMatchesAction } from "@/actions/profile"
import { Button, EmptyState, Skeleton } from "@/components/ui"
import type { MatchHistoryItem } from "@/lib/api/types"
import { formatUsdc, ordinal, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 10

export function MatchHistory({
    userId,
    initialMatches,
    gameNames,
}: {
    userId: string
    initialMatches: MatchHistoryItem[]
    gameNames: Record<string, string>
}) {
    const [matches, setMatches] = React.useState(initialMatches)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [exhausted, setExhausted] = React.useState(
        initialMatches.length < PAGE_SIZE
    )

    async function loadMore() {
        setLoading(true)
        setError(null)
        try {
            const next = await listUserMatchesAction(userId, {
                limit: PAGE_SIZE,
                offset: matches.length,
            })
            setMatches((current) => [...current, ...next])
            if (next.length < PAGE_SIZE) setExhausted(true)
        } catch (cause) {
            setError(
                cause instanceof Error
                    ? cause.message
                    : "Failed to load more matches"
            )
        } finally {
            setLoading(false)
        }
    }

    if (matches.length === 0) {
        return (
            <EmptyState
                icon={<RiSwordLine />}
                title="No matches yet"
                description="Finished matches show up here with rank, prize and points."
            />
        )
    }

    return (
        <div className="space-y-3">
            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 surface-raised">
                {matches.map((match, index) => (
                    <MatchRow
                        key={match.matchId}
                        match={match}
                        gameName={gameNames[match.gameId] ?? match.gameId}
                        index={index % PAGE_SIZE}
                    />
                ))}
                {loading ? <RowSkeleton /> : null}
            </ul>

            {error ? <p className="text-xs text-destructive">{error}</p> : null}

            {!exhausted ? (
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={loadMore}
                    disabled={loading}
                >
                    {loading ? <RiLoader4Line className="animate-spin" /> : null}
                    {loading ? "Loading" : "Load more"}
                </Button>
            ) : null}
        </div>
    )
}

function MatchRow({
    match,
    gameName,
    index,
}: {
    match: MatchHistoryItem
    gameName: string
    index: number
}) {
    return (
        <li
            className="stagger animate-rise-in"
            style={{ "--index": index } as React.CSSProperties}
        >
            <Link
                href={`/room/${match.lobbyPath}`}
                className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40"
            >
                <span
                    className={cn(
                        "tnum grid size-9 shrink-0 place-items-center rounded-lg font-display text-xs",
                        match.isWinner
                            ? "bg-gold/15 text-gold"
                            : "bg-muted text-muted-foreground"
                    )}
                >
                    {match.rank != null ? ordinal(match.rank) : "—"}
                </span>

                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">
                        {gameName}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                        <span className="tnum">{match.playerCount}</span> players
                        · <span className="tnum">{formatUsdc(match.potMicro)}</span>{" "}
                        pot
                    </span>
                </span>

                <span className="shrink-0 text-right">
                    <span
                        className={cn(
                            "tnum block font-display text-sm",
                            match.prizeMicro > 0
                                ? "text-gold"
                                : "text-muted-foreground"
                        )}
                    >
                        {match.prizeMicro > 0
                            ? formatUsdc(match.prizeMicro)
                            : "—"}
                    </span>
                    <span className="tnum block text-xs text-muted-foreground">
                        {match.warsPoint > 0 ? "+" : ""}
                        {match.warsPoint} pts
                    </span>
                </span>

                <span className="shrink-0 text-right text-[11px] whitespace-nowrap text-muted-foreground">
                    {timeAgo(match.finishedAt)}
                </span>
            </Link>
        </li>
    )
}

function RowSkeleton() {
    return (
        <li className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="size-9 shrink-0" />
            <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-3.5 w-14 shrink-0" />
        </li>
    )
}
