import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/section"
import { LeaderboardView } from "@/components/leaderboard/leaderboard-view"
import { getLeaderboard, listGames, listSeasons } from "@/lib/api/server"
import type { LeaderboardPage, Season } from "@/lib/api/types"

export const metadata: Metadata = {
    title: "Leaderboard",
    description:
        "Game, quest, and combined Wars Points standings for the season.",
    alternates: { canonical: "/leaderboard" },
}

const EMPTY: LeaderboardPage = { items: [], total: 0, limit: 25, offset: 0 }

/** The season that contains today, falling back to the most recent one. */
function activeSeason(seasons: Season[]): Season | null {
    const now = Date.now()
    const live = seasons.find(
        (season) =>
            Date.parse(season.startsAt) <= now &&
            Date.parse(season.endsAt) >= now
    )
    return live ?? seasons[0] ?? null
}

export default async function LeaderboardPageRoute() {
    const [games, seasons] = await Promise.all([
        listGames().catch(() => []),
        listSeasons().catch(() => [] as Season[]),
    ])

    const ordered = [...seasons].sort(
        (a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)
    )
    const current = activeSeason(ordered)
    const initial = await getLeaderboard({
        seasonId: current?.id,
        limit: 25,
        board: "all",
    }).catch(() => EMPTY)

    return (
        <PageContainer className="space-y-8">
            <PageHeader
                title="Leaderboard"
                description="Game points come from match results. Quest points come from completed quests. All combines both."
            />
            <LeaderboardView
                initial={initial}
                seasons={ordered}
                games={games}
                currentSeasonId={current?.id ?? null}
            />
        </PageContainer>
    )
}
