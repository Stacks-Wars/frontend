import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/section"
import { GamesDirectory } from "@/components/games/games-directory"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { listGameActivity, listGames } from "@/lib/api/server"

export const metadata: Metadata = {
    title: "Games",
    description: "Every game on Stacks Wars, with live lobby and player counts.",
}

export default async function GamesPage() {
    const [games, activity] = await Promise.all([
        listGames(),
        listGameActivity().catch(() => []),
    ])

    return (
        <PageContainer size="wide" className="space-y-8">
            <PageHeader
                eyebrow="Game directory"
                title="Pick your battleground"
                description="Every title runs on the same lobby, vault, and season system. Counts update live."
                action={<CreateLobbyButton>Create lobby</CreateLobbyButton>}
            />
            <GamesDirectory games={games} initialActivity={activity} />
        </PageContainer>
    )
}
