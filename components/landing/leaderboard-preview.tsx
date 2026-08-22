"use client"

import { UserChip } from "@/components/common/user-chip"
import { RankBadge } from "@/components/leaderboard/rank-badge"
import { SectionHeader } from "@/components/common/section"
import { ButtonLink, EmptyState } from "@/components/ui"
import { useLeaderboard } from "@/hooks/use-leaderboard"
import type { LeaderboardPage } from "@/lib/api/types"
import { compact } from "@/lib/format"

export function LeaderboardPreview({
    initial,
    seasonId,
    seasonName,
}: {
    initial: LeaderboardPage
    seasonId: number | null
    seasonName: string | null
}) {
    const { items } = useLeaderboard(
        { seasonId: seasonId ?? undefined },
        initial
    )
    const top = items.slice(0, 8)

    return (
        <section className="space-y-4">
            <SectionHeader
                title="Season standings"
                description={
                    seasonName
                        ? `${seasonName} — updated the moment a match settles.`
                        : "Updated the moment a match settles."
                }
                action={
                    <ButtonLink href="/leaderboard" variant="ghost" size="sm">
                        Full board
                    </ButtonLink>
                }
            />

            {top.length === 0 ? (
                <EmptyState
                    title="Season hasn't started"
                    description="The first settled match puts someone at the top."
                />
            ) : (
                <ol className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/70 surface-raised">
                    {top.map((entry, index) => (
                        <li
                            key={entry.userId}
                            className="stagger flex animate-rise-in items-center gap-3 px-4 py-2.5"
                            style={{ "--index": index } as React.CSSProperties}
                        >
                            <RankBadge rank={entry.rank} />
                            <UserChip user={entry} size="xs" />
                            <span className="ml-auto flex items-baseline gap-4">
                                <span className="tnum hidden text-xs text-muted-foreground sm:block">
                                    {compact(entry.totalWins)} wins
                                </span>
                                <span className="tnum font-display text-gold">
                                    {compact(entry.points)}
                                </span>
                            </span>
                        </li>
                    ))}
                </ol>
            )}
        </section>
    )
}
