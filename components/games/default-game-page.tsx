import Link from "next/link"
import { notFound } from "next/navigation"

import { CreateLobbyButton } from "@/components/games/create-lobby-button"
import { getGame } from "@/lib/api/server"
import { gameVisual } from "@/lib/games"
import { cn } from "@/lib/utils"

type Props = {
    gameId: string
}

/** Shared fallback UI when a game has no custom page under `/game/{id}`. */
export async function DefaultGamePage({ gameId }: Props) {
    const game = await getGame(gameId)
    if (!game) notFound()

    const visual = gameVisual(game.id)

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
            <Link
                href="/games"
                className="text-sm text-muted-foreground hover:text-foreground"
            >
                ← Games
            </Link>
            <div
                className={cn(
                    "mt-6 overflow-hidden rounded-[1.75rem] border border-border/70 bg-card bg-linear-to-br to-transparent p-8",
                    visual.accent ?? "from-primary/40"
                )}
            >
                <h1 className="font-display text-4xl tracking-tight">
                    {game.name}
                </h1>
                <p className="mt-2 max-w-xl text-muted-foreground">
                    {game.description}
                </p>
                <p className="mt-3 text-sm text-muted-foreground">
                    {game.minPlayers}–{game.maxPlayers} players · fee{" "}
                    {game.fee.percentage}%
                </p>
                <div className="mt-8">
                    <CreateLobbyButton
                        game={{ id: game.id, name: game.name }}
                    />
                </div>
            </div>
        </div>
    )
}
