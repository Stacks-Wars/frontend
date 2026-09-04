import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { ClosingCta } from "@/components/landing/closing-cta"
import { FeaturedGames } from "@/components/landing/featured-games"
import { GettingStartedRail } from "@/components/quests/getting-started-rail"
import { Hero } from "@/components/landing/hero"
import { HowItWorks } from "@/components/landing/how-it-works"
import { LeaderboardPreview } from "@/components/landing/leaderboard-preview"
import { LiveMatches } from "@/components/landing/live-matches"
import { LandingRecentMatches } from "@/components/landing/recent-matches"
import { lobbyListChainForSession } from "@/lib/chain/server"
import {
    HOME_DESCRIPTION,
    HOME_TITLE,
    siteOgImages,
    siteTwitterImages,
} from "@/lib/seo"
import {
    getLeaderboard,
    listGameActivity,
    listGames,
    listLobbies,
    listSeasons,
} from "@/lib/api/server"
import type { LeaderboardPage, Season } from "@/lib/api/types"

export const metadata: Metadata = {
    title: { absolute: HOME_TITLE },
    description: HOME_DESCRIPTION,
    openGraph: {
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        url: "/",
        images: siteOgImages(),
    },
    twitter: {
        card: "summary_large_image",
        title: HOME_TITLE,
        description: HOME_DESCRIPTION,
        images: siteTwitterImages(),
    },
    alternates: { canonical: "/" },
}

const EMPTY_BOARD: LeaderboardPage = {
    items: [],
    total: 0,
    limit: 10,
    offset: 0,
}

function activeSeason(seasons: Season[]): Season | null {
    const now = Date.now()
    const live = seasons.find(
        (season) =>
            Date.parse(season.startsAt) <= now &&
            Date.parse(season.endsAt) >= now
    )
    return live ?? seasons[0] ?? null
}

export default async function LandingPage() {
    const chain = await lobbyListChainForSession()
    const [games, activity, lobbies, recentFinished, seasons] =
        await Promise.all([
            listGames().catch(() => []),
            listGameActivity().catch(() => []),
            listLobbies({ limit: 12, ...(chain ? { chain } : {}) }).catch(
                () => []
            ),
            listLobbies({ status: ["finished"], limit: 10 }).catch(() => []),
            listSeasons().catch(() => [] as Season[]),
        ])

    const season = activeSeason(
        [...seasons].sort(
            (a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)
        )
    )
    const board = await getLeaderboard({
        seasonId: season?.id,
        limit: 10,
        board: "all",
    }).catch(() => EMPTY_BOARD)

    return (
        <PageContainer size="wide" className="space-y-16 pb-8">
            <Hero activity={activity} games={games} initialLobbies={lobbies} />
            <GettingStartedRail />
            <FeaturedGames games={games} activity={activity} />
            <LiveMatches initialLobbies={lobbies} games={games} />

            <div className="grid gap-8 lg:grid-cols-2">
                <LeaderboardPreview
                    initial={board}
                    seasonId={season?.id ?? null}
                    seasonName={season?.name ?? null}
                />
                <LandingRecentMatches initial={recentFinished} />
            </div>

            <HowItWorks />
            <ClosingCta />
        </PageContainer>
    )
}
