import { GameCard } from "@/components/games/game-card"
import { listGames } from "@/lib/api/server"
import { gameVisual } from "@/lib/games"

export default async function GamesPage() {
    const games = await listGames()

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-display text-4xl tracking-tight">Games</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
                Pick an arena and spin up a free lobby.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {games.map((game) => {
                    const visual = gameVisual(game.id)
                    return (
                        <GameCard
                            key={game.id}
                            name={game.name}
                            slug={game.id}
                            blurb={game.description}
                            image={visual.image}
                            accent={visual.accent}
                        />
                    )
                })}
            </div>
            {games.length === 0 ? (
                <p className="mt-8 text-sm text-muted-foreground">
                    No games registered on the server yet.
                </p>
            ) : null}
        </div>
    )
}
