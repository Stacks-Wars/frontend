"use client"

import * as React from "react"

import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table"
import {
    Badge,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui"
import { useLeaderboard } from "@/hooks/use-leaderboard"
import type {
    GameMetadata,
    LeaderboardBoard,
    LeaderboardPage,
    Season,
} from "@/lib/api/types"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"

const BOARDS: { id: LeaderboardBoard; label: string }[] = [
    { id: "all", label: "All" },
    { id: "game", label: "Game" },
    { id: "quests", label: "Quest" },
]

function boardCopy(board: LeaderboardBoard, allSeasons: boolean): string {
    if (board === "game") {
        return allSeasons
            ? "Wars Points earned in matches across every season."
            : "Wars Points earned in matches this season."
    }
    if (board === "quests") {
        return allSeasons
            ? "Wars Points earned in quests across every season."
            : "Wars Points earned in quests this season."
    }
    return allSeasons
        ? "Wars Points earned this across every season."
        : "Wars Points earned this season."
}

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
    const [boardKind, setBoardKind] = React.useState<LeaderboardBoard>("all")
    const [seasonId, setSeasonId] = React.useState<number | null>(
        currentSeasonId
    )
    const [gameId, setGameId] = React.useState<string>("all")

    const showGameFilter = boardKind === "game"
    const allSeasons = seasonId == null

    const scope = React.useMemo(
        () => ({
            board: boardKind,
            seasonId: seasonId ?? undefined,
            gameId: showGameFilter && gameId !== "all" ? gameId : undefined,
        }),
        [boardKind, seasonId, gameId, showGameFilter]
    )

    const untouched =
        boardKind === "all" && seasonId === currentSeasonId && gameId === "all"

    const board = useLeaderboard(scope, untouched ? initial : undefined)
    const season = seasons.find((item) => item.id === seasonId)

    const seasonLabels = React.useMemo<Record<string, string>>(
        () => ({
            all: "All",
            ...Object.fromEntries(
                seasons.map((item) => [String(item.id), item.name])
            ),
        }),
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
                    {BOARDS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setBoardKind(item.id)}
                            className={cn(
                                "rounded-md px-3.5 py-1.5 text-sm transition-colors",
                                boardKind === item.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <Select
                    value={allSeasons ? "all" : String(seasonId)}
                    onValueChange={(value) => {
                        if (!value || value === "all") {
                            setSeasonId(null)
                            return
                        }
                        const next = Number.parseInt(value, 10)
                        setSeasonId(Number.isNaN(next) ? null : next)
                    }}
                    items={seasonLabels}
                >
                    <SelectTrigger className="w-44" aria-label="Season">
                        <SelectValue placeholder="Season" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        {seasons.map((item) => (
                            <SelectItem key={item.id} value={String(item.id)}>
                                {item.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {showGameFilter ? (
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
                ) : null}

                {season ? (
                    <Badge variant="outline" className="ml-auto">
                        {formatDate(season.startsAt)} —{" "}
                        {formatDate(season.endsAt)}
                    </Badge>
                ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
                {boardCopy(boardKind, allSeasons)}
            </p>

            <LeaderboardTable
                items={board.items}
                loading={board.loading}
                fetching={board.fetching}
                page={board.page}
                pageCount={board.pageCount}
                onPage={board.setPage}
                hideMatchStats={boardKind === "quests"}
                emptyTitle={
                    boardKind === "quests"
                        ? "Nobody has claimed yet"
                        : "Nobody has scored yet"
                }
                emptyDescription={
                    boardKind === "quests"
                        ? "Quest points show up here after a claim."
                        : boardKind === "all"
                          ? "Points land here when a match settles or a quest is claimed."
                          : "Points land here as soon as the first match of this season settles."
                }
            />
        </div>
    )
}
