import { GameCard } from "@/components/games/game-card"
import { GAMES } from "@/lib/games"

export default function GamesPage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-display text-4xl tracking-tight">Games</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
                Pick an arena and spin up a lobby. Matchmaking and room flows
                hook in next.
            </p>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
                {GAMES.map((game) => (
                    <GameCard key={game.slug} {...game} />
                ))}
            </div>
        </div>
    )
}
