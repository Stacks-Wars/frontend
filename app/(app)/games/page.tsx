import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/section"
import { GamesDirectory } from "@/components/games/games-directory"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { JsonLd } from "@/components/seo/json-ld"
import { listGameActivity, listGames } from "@/lib/api/server"
import { gamesItemListJsonLd, SITE_KEYWORDS } from "@/lib/seo"

export const metadata: Metadata = {
    title: "Games",
    description:
        "Multiplayer onchain games on Stacks Wars, with live lobby and player counts.",
    keywords: SITE_KEYWORDS,
    alternates: { canonical: "/games" },
}

export default async function GamesPage() {
    const [games, activity] = await Promise.all([
        listGames(),
        listGameActivity().catch(() => []),
    ])

    return (
        <PageContainer size="wide" className="space-y-8">
            <JsonLd data={gamesItemListJsonLd(games)} />
            <PageHeader
                eyebrow="Game directory"
                title="Pick your battleground"
                description="Every title runs on the same lobby, vault, and season system. Pick a chain, then sit down. Counts update live."
                action={<CreateLobbyButton>Create lobby</CreateLobbyButton>}
            />
            <GamesDirectory games={games} initialActivity={activity} />
        </PageContainer>
    )
}
