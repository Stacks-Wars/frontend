import { Hero } from "@/components/landing/hero"
import { GameCard } from "@/components/games/game-card"
import { listGames } from "@/lib/api/server"
import { gameVisual } from "@/lib/games"

export default async function HomePage() {
    const games = await listGames().catch(() => [])

    return (
        <>
            <Hero />
            <section className="mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
                <div className="mb-6 flex items-end justify-between gap-4">
                    <div>
                        <h2 className="font-display text-3xl tracking-tight">
                            Choose your battlefield
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Four arenas. One season ladder.
                        </p>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
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
            </section>
        </>
    )
}
