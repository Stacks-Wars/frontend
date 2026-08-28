import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/common/page-container"
import { SectionHeader } from "@/components/common/section"
import { Achievements } from "@/components/profile/achievements"
import { FavouriteGames } from "@/components/profile/favourite-games"
import { MatchHistory } from "@/components/profile/match-history"
import { ProfileHeader } from "@/components/profile/profile-header"
import { ProfileStats } from "@/components/profile/profile-stats"
import { SeasonHistory } from "@/components/profile/season-history"
import { getUserByUsername, getUserProfile, listGames } from "@/lib/api/server"
import { displayNameFor, pluralize } from "@/lib/format"

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { username } = await params
    const user = await getUserByUsername(username).catch(() => null)
    if (!user) return { title: "Player" }
    const name = displayNameFor(user)
    return {
        title: name,
        description: `${name} on Stacks Wars. Match history and season standings.`,
    }
}

export default async function ProfilePage({ params }: Params) {
    const { username } = await params

    const user = await getUserByUsername(username)
    if (!user) notFound()

    const [profile, games] = await Promise.all([
        getUserProfile(user.id),
        listGames().catch(() => []),
    ])
    if (!profile) notFound()

    const gameNames: Record<string, string> = {}
    for (const game of games) {
        gameNames[game.id] = game.name
    }

    return (
        <PageContainer size="wide" className="space-y-8">
            <ProfileHeader profile={profile} />
            <ProfileStats lifetime={profile.lifetime} />

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                <section className="min-w-0 space-y-4">
                    <SectionHeader
                        title="Match history"
                        description={pluralize(
                            profile.lifetime.totalMatches,
                            "match",
                            "matches"
                        )}
                    />
                    <MatchHistory
                        userId={user.id}
                        initialMatches={profile.recentMatches}
                        gameNames={gameNames}
                    />

                    <SectionHeader
                        title="Achievements"
                        description="Earned from settled matches"
                        className="pt-4"
                    />
                    <Achievements profile={profile} />
                </section>

                <div className="space-y-8">
                    <section className="space-y-4">
                        <SectionHeader title="Favourite games" />
                        <FavouriteGames
                            games={profile.favouriteGames}
                            gameNames={gameNames}
                        />
                    </section>

                    <section className="space-y-4">
                        <SectionHeader title="Season history" />
                        <SeasonHistory
                            statLines={profile.statLines}
                            currentSeasonId={profile.currentSeasonId}
                            gameNames={gameNames}
                        />
                    </section>
                </div>
            </div>
        </PageContainer>
    )
}
