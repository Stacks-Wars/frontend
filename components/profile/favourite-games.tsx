import Link from "next/link"
import { RiArrowRightSLine, RiGamepadLine } from "@remixicon/react"

import { GameArt } from "@/components/common/game-art"
import { EmptyState } from "@/components/ui"
import type { FavouriteGame } from "@/lib/api/types"

export function FavouriteGames({
    games,
    gameNames,
}: {
    games: FavouriteGame[]
    gameNames: Record<string, string>
}) {
    if (games.length === 0) {
        return (
            <EmptyState
                icon={<RiGamepadLine />}
                title="No games played"
                description="Games this player finishes a match in show up here."
                className="py-10"
            />
        )
    }

    return (
        <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 surface-raised">
            {games.map((game, index) => {
                const name = gameNames[game.gameId] ?? game.gameId
                return (
                    <li
                        key={game.gameId}
                        className="stagger animate-rise-in"
                        style={{ "--index": index } as React.CSSProperties}
                    >
                        <Link
                            href={`/games/${game.gameId}`}
                            className="flex items-center gap-3 px-3 py-2.5 hover:bg-muted/40"
                        >
                            <GameArt
                                gameId={game.gameId}
                                name={name}
                                aspect="square"
                                className="size-12 shrink-0 rounded-lg"
                            />
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                    {name}
                                </span>
                                <span className="block text-xs text-muted-foreground">
                                    <span className="tnum">{game.matches}</span>{" "}
                                    played ·{" "}
                                    <span className="tnum">{game.wins}</span> won
                                </span>
                            </span>
                            <RiArrowRightSLine className="size-4 shrink-0 text-muted-foreground" />
                        </Link>
                    </li>
                )
            })}
        </ul>
    )
}
