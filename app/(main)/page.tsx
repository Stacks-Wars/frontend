import { Hero } from "@/components/landing/hero"
import { GameCard } from "@/components/games/game-card"
import { GAMES } from "@/lib/games"

export default function HomePage() {
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
                    {GAMES.map((game) => (
                        <GameCard key={game.slug} {...game} />
                    ))}
                </div>
            </section>
        </>
    )
}
