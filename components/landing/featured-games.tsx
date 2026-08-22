"use client"

import { SectionHeader } from "@/components/common/section"
import { GameCard } from "@/components/games/game-card"
import { ButtonLink } from "@/components/ui"
import { useGameActivity } from "@/hooks/use-game-activity"
import type { GameActivity, GameMetadata } from "@/lib/api/types"

export function FeaturedGames({
    games,
    activity,
}: {
    games: GameMetadata[]
    activity: GameActivity[]
}) {
    const { get } = useGameActivity(activity)

    // Busiest first, so the front page always leads with something alive.
    const featured = [...games]
        .sort((a, b) => {
            const left = get(a.id)
            const right = get(b.id)
            return (
                right.activePlayers + right.waitingLobbies -
                (left.activePlayers + left.waitingLobbies)
            )
        })
        .slice(0, 3)

    return (
        <section className="space-y-4">
            <SectionHeader
                title="Featured games"
                description="Every title settles through the same vault and season system."
                action={
                    <ButtonLink href="/games" variant="ghost" size="sm">
                        All games
                    </ButtonLink>
                }
            />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {featured.map((game, index) => (
                    <GameCard
                        key={game.id}
                        game={game}
                        activity={get(game.id)}
                        index={index}
                    />
                ))}
            </div>
        </section>
    )
}
