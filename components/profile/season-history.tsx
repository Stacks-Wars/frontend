import { RiCalendarLine } from "@remixicon/react"

import { Badge, EmptyState } from "@/components/ui"
import type { UserStatLine } from "@/lib/api/types"
import { formatUsdc } from "@/lib/format"
import { cn } from "@/lib/utils"

type SeasonGroup = {
    seasonId: number
    seasonName: string
    points: number
    lines: UserStatLine[]
}

function groupBySeason(statLines: UserStatLine[]): SeasonGroup[] {
    const groups = new Map<number, SeasonGroup>()
    for (const line of statLines) {
        const group = groups.get(line.seasonId)
        if (group) {
            group.points += line.points
            group.lines.push(line)
            continue
        }
        groups.set(line.seasonId, {
            seasonId: line.seasonId,
            seasonName: line.seasonName,
            points: line.points,
            lines: [line],
        })
    }
    return Array.from(groups.values()).sort((a, b) => b.seasonId - a.seasonId)
}

export function SeasonHistory({
    statLines,
    currentSeasonId,
    gameNames,
}: {
    statLines: UserStatLine[]
    currentSeasonId: number | null
    gameNames: Record<string, string>
}) {
    const seasons = groupBySeason(statLines)

    if (seasons.length === 0) {
        return (
            <EmptyState
                icon={<RiCalendarLine />}
                title="No season stats"
                description="Season points are recorded once a match finishes."
                className="py-10"
            />
        )
    }

    return (
        <div className="space-y-3">
            {seasons.map((season, index) => {
                const isCurrent = season.seasonId === currentSeasonId
                return (
                    <article
                        key={season.seasonId}
                        className={cn(
                            "stagger animate-rise-in overflow-hidden rounded-2xl border surface-raised",
                            isCurrent ? "border-primary/40" : "border-border/70"
                        )}
                        style={{ "--index": index } as React.CSSProperties}
                    >
                        <header className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-2.5">
                            <div className="flex min-w-0 items-center gap-2">
                                <h3 className="truncate text-sm font-medium">
                                    {season.seasonName}
                                </h3>
                                {isCurrent ? (
                                    <Badge variant="primary">Current</Badge>
                                ) : null}
                            </div>
                            <span className="tnum shrink-0 font-display text-sm">
                                {season.points} pts
                            </span>
                        </header>
                        <ul className="divide-y divide-border/50">
                            {season.lines.map((line) => (
                                <li
                                    key={line.gameId}
                                    className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-0.5 px-3 py-2"
                                >
                                    <span className="truncate text-sm">
                                        {gameNames[line.gameId] ?? line.gameId}
                                    </span>
                                    <span className="tnum text-right text-sm">
                                        {line.points} pts
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        <span className="tnum">
                                            {line.totalMatches}
                                        </span>{" "}
                                        played ·{" "}
                                        <span className="tnum">
                                            {line.totalWins}
                                        </span>{" "}
                                        won
                                    </span>
                                    <span
                                        className={cn(
                                            "tnum text-right text-xs",
                                            line.totalPnl > 0 && "text-success",
                                            line.totalPnl < 0 &&
                                                "text-destructive",
                                            line.totalPnl === 0 &&
                                                "text-muted-foreground"
                                        )}
                                    >
                                        {formatUsdc(line.totalPnl, {
                                            sign: true,
                                            zero: "$0.00",
                                        })}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </article>
                )
            })}
        </div>
    )
}
