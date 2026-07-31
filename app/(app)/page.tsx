import { PageContainer } from "@/components/common/page-container"
import { ClosingCta } from "@/components/landing/closing-cta"
import { FeaturedGames } from "@/components/landing/featured-games"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { LeaderboardPreview } from "@/components/landing/leaderboard-preview"
import { LiveMatches } from "@/components/landing/live-matches"
import { RecentResults } from "@/components/landing/recent-results"
import {
    getLeaderboard,
    listGameActivity,
    listGames,
    listLobbies,
    listRecentMatches,
    listSeasons,
} from "@/lib/api/server"
import type { LeaderboardPage, Season } from "@/lib/api/types"

const EMPTY_BOARD: LeaderboardPage = { items: [], total: 0, limit: 8, offset: 0 }

function activeSeason(seasons: Season[]): Season | null {
    const now = Date.now()
    const live = seasons.find(
        (season) =>
            Date.parse(season.startsAt) <= now && Date.parse(season.endsAt) >= now
    )
    return live ?? seasons[0] ?? null
}

export default async function LandingPage() {
    const [games, activity, lobbies, seasons, recentMatches] = await Promise.all([
        listGames().catch(() => []),
        listGameActivity().catch(() => []),
        listLobbies({ limit: 12 }).catch(() => []),
        listSeasons().catch(() => [] as Season[]),
        listRecentMatches({ limit: 8 }).catch(() => []),
    ])

    const season = activeSeason(
        [...seasons].sort((a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt))
    )
    const board = await getLeaderboard({
        seasonId: season?.id,
        limit: 8,
    }).catch(() => EMPTY_BOARD)

    return (
        <PageContainer size="wide" className="space-y-16 pb-8">
            <Hero
                activity={activity}
                games={games}
                initialLobbies={lobbies}
            />
            <FeaturedGames games={games} activity={activity} />
            <LiveMatches initialLobbies={lobbies} games={games} />

            <div className="grid gap-8 lg:grid-cols-2">
                <LeaderboardPreview
                    initial={board}
                    seasonId={season?.id ?? null}
                    seasonName={season?.name ?? null}
                />
                <RecentResults initial={recentMatches} games={games} />
            </div>

            <HowItWorks />
            <ClosingCta />
        </PageContainer>
    )
}
