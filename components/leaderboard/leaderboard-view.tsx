"use client"

import * as React from "react"

import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import { PodiumRow } from "@/components/leaderboard/podium-row"
import {
    Badge,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui"
import { useLeaderboard } from "@/hooks/use-leaderboard"
import type { GameMetadata, LeaderboardPage, Season } from "@/lib/api/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

type ScopeTab = "season" | "all-time"

export function LeaderboardView({
    initial,
    seasons,
    games,
    currentSeasonId,
}: {
    initial: LeaderboardPage
    seasons: Season[]
    games: GameMetadata[]
    currentSeasonId: number | null
}) {
    const [tab, setTab] = React.useState<ScopeTab>(
        currentSeasonId != null ? "season" : "all-time"
    )
    const [seasonId, setSeasonId] = React.useState<number | null>(
        currentSeasonId
    )
    const [gameId, setGameId] = React.useState<string>("all")

    const scope = React.useMemo(
        () => ({
            seasonId: tab === "season" && seasonId != null ? seasonId : undefined,
            gameId: gameId === "all" ? undefined : gameId,
        }),
        [tab, seasonId, gameId]
    )

    const untouched =
        tab === "season" && seasonId === currentSeasonId && gameId === "all"

    const board = useLeaderboard(scope, untouched ? initial : undefined)
    const season = seasons.find((item) => item.id === seasonId)

    // Select triggers render the raw value unless the labels are declared here.
    const seasonLabels = React.useMemo<Record<string, string>>(
        () =>
            Object.fromEntries(
                seasons.map((item) => [String(item.id), item.name])
            ),
        [seasons]
    )
    const gameLabels = React.useMemo<Record<string, string>>(
        () => ({
            all: "Every game",
            ...Object.fromEntries(games.map((game) => [game.id, game.name])),
        }),
        [games]
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex rounded-lg border border-border/70 p-0.5 surface-raised">
                    {(
                        [
                            { id: "season", label: "Season" },
                            { id: "all-time", label: "All time" },
                        ] as const
                    ).map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={cn(
                                "rounded-md px-3.5 py-1.5 text-sm transition-colors",
                                tab === item.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {tab === "season" && seasons.length > 0 ? (
                    <Select
                        value={String(seasonId ?? "")}
                        onValueChange={(value) =>
                            setSeasonId(value ? Number.parseInt(value, 10) : null)
                        }
                        items={seasonLabels}
                    >
                        <SelectTrigger className="w-44" aria-label="Season">
                            <SelectValue placeholder="Season" />
                        </SelectTrigger>
                        <SelectContent>
                            {seasons.map((item) => (
                                <SelectItem
                                    key={item.id}
                                    value={String(item.id)}
                                >
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : null}

                <Select
                    value={gameId}
                    onValueChange={(value) => setGameId(value ?? "all")}
                    items={gameLabels}
                >
                    <SelectTrigger className="w-44" aria-label="Game">
                        <SelectValue placeholder="Game" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Every game</SelectItem>
                        {games.map((game) => (
                            <SelectItem key={game.id} value={game.id}>
                                {game.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {season && tab === "season" ? (
                    <Badge variant="outline" className="ml-auto">
                        {formatDate(season.startsAt)} —{" "}
                        {formatDate(season.endsAt)}
                    </Badge>
                ) : null}
            </div>

            {board.page === 0 && board.items.length >= 3 ? (
                <PodiumRow entries={board.items.slice(0, 3)} />
            ) : null}

            <LeaderboardTable
                items={board.items}
                loading={board.loading}
                fetching={board.fetching}
                page={board.page}
                pageCount={board.pageCount}
                onPage={board.setPage}
            />
        </div>
    )
}
