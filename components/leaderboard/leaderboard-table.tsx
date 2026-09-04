"use client"

import {
    RiArrowLeftSLine,
    RiArrowRightSLine,
} from "@remixicon/react"

import { RankBadge } from "@/components/leaderboard/rank-badge"
import { UserChip } from "@/components/common/user-chip"
import { LeaderboardTableSkeleton } from "@/components/common/list-skeleton"
import { Button, EmptyState } from "@/components/ui"
import type { RankedEntry } from "@/hooks/use-leaderboard"
import { compact, formatPercent, formatUsdc } from "@/lib/format"
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
    const cols = hideMatchStats
        ? "sm:grid-cols-[2.5rem_minmax(0,1fr)_5.5rem]"
        : "sm:grid-cols-[2.5rem_minmax(0,1fr)_5.5rem_5.5rem_5.5rem]"

    if (loading) {
        return <LeaderboardTableSkeleton hideMatchStats={hideMatchStats} />
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
                <div
                    className={cn(
                        "hidden gap-3 border-b border-border/60 px-4 py-2.5 text-[11px] tracking-wide text-muted-foreground uppercase sm:grid",
                        cols
                    )}
                >
                    <span>#</span>
                    <span>Player</span>
                    {hideMatchStats ? null : (
                        <>
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
                                "stagger grid animate-rise-in grid-cols-[2.5rem_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-0.5 px-4 py-3 transition-colors sm:items-center",
                                cols,
                                entry.userId === selfId && "bg-primary/10"
                            )}
                            style={{ "--index": index } as React.CSSProperties}
                        >
                            <span className="col-start-1 row-start-1 row-span-2 self-center sm:row-span-1">
                                <RankBadge rank={entry.rank} />
                            </span>

                            <div className="col-start-2 row-start-1 min-w-0">
                                <UserChip
                                    user={entry}
                                    size="sm"
                                    subtitle={
                                        entry.userId === selfId
                                            ? "You"
                                            : undefined
                                    }
                                />
                            </div>

                            <span
                                className={cn(
                                    "col-start-3 row-start-1 tnum text-right font-display text-base text-gold",
                                    hideMatchStats
                                        ? "sm:col-start-3"
                                        : "sm:col-start-5"
                                )}
                            >
                                {compact(entry.points)}
                                <span className="ml-1 text-xs font-sans text-gold/80 sm:hidden">
                                    pts
                                </span>
                            </span>

                            {hideMatchStats ? null : (
                                <>
                                    <p className="col-start-2 row-start-2 col-span-2 pl-[2.625rem] text-xs text-muted-foreground sm:hidden">
                                        {compact(entry.totalWins)} wins
                                        {" · "}
                                        {formatPercent(entry.winRateBps)} win
                                        rate
                                    </p>
                                    <span className="tnum hidden text-right text-sm sm:col-start-3 sm:row-start-1 sm:block">
                                        {compact(entry.totalWins)}
                                        <span className="ml-1 text-xs text-muted-foreground">
                                            {formatPercent(entry.winRateBps)}
                                        </span>
                                    </span>
                                    <span
                                        className={cn(
                                            "tnum hidden text-right text-sm sm:col-start-4 sm:row-start-1 sm:block",
                                            entry.totalPnl > 0 &&
                                                "text-success",
                                            entry.totalPnl < 0 &&
                                                "text-destructive"
                                        )}
                                    >
                                        {formatUsdc(entry.totalPnl, {
                                            sign: true,
                                        })}
                                    </span>
                                </>
                            )}
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
