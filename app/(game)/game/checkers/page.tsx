import Link from "next/link"

import { CreateLobbyButton } from "@/components/games/create-lobby-button"
import { getGame } from "@/lib/api/server"
import { notFound } from "next/navigation"

/**
 * Custom Checkers arena page.
 * Static segment `/game/checkers` wins over `/game/[gameId]`.
 */
export default async function CheckersGamePage() {
    const game = await getGame("checkers")
    if (!game) notFound()

    return (
        <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
            <Link
                href="/games"
                className="text-sm text-muted-foreground hover:text-foreground"
            >
                ← Games
            </Link>
            <p className="mt-6 text-sm tracking-wide text-primary uppercase">
                Arena
            </p>
            <h1 className="mt-2 font-display text-5xl tracking-tight">
                Checkers
            </h1>
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">
                {game.description}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
                {game.minPlayers} players · fee {game.fee.percentage}%
            </p>
            <div className="mt-10 flex flex-wrap gap-3">
                <CreateLobbyButton
                    game={{ id: "checkers", name: "Checkers" }}
                    className="bg-[#2c61b8] text-white hover:bg-[#2c61b8]/90"
                >
                    Start Checkers Lobby
                </CreateLobbyButton>
            </div>
        </div>
    )
}
