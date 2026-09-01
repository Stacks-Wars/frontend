"use client"

import {
    RiArrowDownSLine,
    RiArrowLeftSLine,
    RiArrowRightSLine,
    RiArrowUpSLine,
    RiSubtractLine,
} from "@remixicon/react"

import { RankBadge } from "@/components/leaderboard/rank-badge"
import { UserChip } from "@/components/common/user-chip"
import { LeaderboardTableSkeleton } from "@/components/common/list-skeleton"
import { Button, EmptyState } from "@/components/ui"
import type { RankedEntry } from "@/hooks/use-leaderboard"
import { formatUsdc, compact } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useSessionUser } from "@/stores/session"

export function LeaderboardTable({
    items,
    loading,
    fetching,
    page,
    pageCount,
    onPage,
    hideMatchStats = false,
    emptyTitle = "Nobody has scored yet",
    emptyDescription = "Points land here as soon as the first match of this season settles.",
}: {
    items: RankedEntry[]
    loading: boolean
    fetching: boolean
    page: number
    pageCount: number
    onPage: (page: number) => void
    hideMatchStats?: boolean
    emptyTitle?: string
    emptyDescription?: string
}) {
    const selfId = useSessionUser()?.id ?? null

    if (loading) {
        return <LeaderboardTableSkeleton />
    }

    if (items.length === 0) {
        return (
            <EmptyState
                title={emptyTitle}
                description={emptyDescription}
            />
        )
    }

    return (
        <div className="space-y-4">
            <div
                className={cn(
                    "overflow-hidden rounded-2xl border border-border/70 transition-opacity surface-raised",
                    fetching && "opacity-70"
                )}
            >
                <div className="hidden grid-cols-[3rem_minmax(0,1fr)_5rem_5rem_6rem_6rem] gap-3 border-b border-border/60 px-4 py-2.5 text-[11px] tracking-wide text-muted-foreground uppercase sm:grid">
                    <span>#</span>
                    <span>Player</span>
                    {hideMatchStats ? (
                        <>
                            <span />
                            <span />
                            <span />
                        </>
                    ) : (
                        <>
                            <span className="text-right">Played</span>
                            <span className="text-right">Wins</span>
                            <span className="text-right">Net</span>
                        </>
                    )}
                    <span className="text-right">Points</span>
                </div>

                <ol className="divide-y divide-border/50">
                    {items.map((entry, index) => (
                        <li
                            key={entry.userId}
                            className={cn(
                                "stagger grid animate-rise-in grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors sm:grid-cols-[3rem_minmax(0,1fr)_5rem_5rem_6rem_6rem]",
                                entry.userId === selfId && "bg-primary/10"
                            )}
                            style={{ "--index": index } as React.CSSProperties}
                        >
                            <span className="flex items-center gap-1">
                                <RankBadge rank={entry.rank} />
                                <Movement value={entry.movement} />
                            </span>

                            <UserChip
                                user={entry}
                                size="sm"
                                subtitle={
                                    entry.userId === selfId ? "You" : undefined
                                }
                            />

                            {hideMatchStats ? (
                                <>
                                    <span className="hidden sm:block" />
                                    <span className="hidden sm:block" />
                                    <span className="hidden sm:block" />
                                </>
                            ) : (
                                <>
                            <span className="tnum hidden text-right text-sm text-muted-foreground sm:block">
                                {compact(entry.totalMatches)}
                            </span>
                            <span className="tnum hidden text-right text-sm sm:block">
                                {compact(entry.totalWins)}
                                <span className="ml-1 text-xs text-muted-foreground">
                                    {(entry.winRateBps / 100).toFixed(0)}%
                                </span>
                            </span>
                            <span
                                className={cn(
                                    "tnum hidden text-right text-sm sm:block",
                                    entry.totalPnl > 0 && "text-success",
                                    entry.totalPnl < 0 && "text-destructive"
                                )}
                            >
                                {formatUsdc(entry.totalPnl, { sign: true })}
                            </span>
                                </>
                            )}
                            <span className="tnum text-right font-display text-base text-gold">
                                {compact(entry.points)}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>

            {pageCount > 1 ? (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">
                        Page <span className="tnum">{page + 1}</span> of{" "}
                        <span className="tnum">{pageCount}</span>
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page === 0}
                            onClick={() => onPage(page - 1)}
                        >
                            <RiArrowLeftSLine />
                            Back
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page + 1 >= pageCount}
                            onClick={() => onPage(page + 1)}
                        >
                            Next
                            <RiArrowRightSLine />
                        </Button>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

function Movement({ value }: { value: number }) {
    if (value === 0) {
        return (
            <RiSubtractLine
                className="size-3 text-muted-foreground/40"
                aria-label="No change"
            />
        )
    }
    const up = value > 0
    return (
        <span
            className={cn(
                "tnum flex animate-pop-in items-center text-[10px]",
                up ? "text-success" : "text-destructive"
            )}
            aria-label={`${up ? "Up" : "Down"} ${Math.abs(value)}`}
        >
            {up ? (
                <RiArrowUpSLine className="size-3" />
            ) : (
                <RiArrowDownSLine className="size-3" />
            )}
            {Math.abs(value)}
        </span>
    )
}
