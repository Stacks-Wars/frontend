import type { Metadata } from "next"
import { Suspense } from "react"

import { LobbyBrowserSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/section"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { LobbyBrowser } from "@/components/lobbies/lobby-browser"
import { listGames, listLobbies } from "@/lib/api/server"
import { lobbyListChainForSession } from "@/lib/chain/server"
import { SITE_KEYWORDS } from "@/lib/seo"

export const metadata: Metadata = {
    title: "Lobbies",
    description:
        "Open and live multiplayer lobbies. Lobbies are grouped by the chain you are playing on.",
    keywords: SITE_KEYWORDS,
    alternates: { canonical: "/lobbies" },
}

export default async function LobbiesPage() {
    const chain = await lobbyListChainForSession()
    const [lobbies, games] = await Promise.all([
        listLobbies({ limit: 120, ...(chain ? { chain } : {}) }).catch(
            () => []
        ),
        listGames().catch(() => []),
    ])

    return (
        <PageContainer size="wide" className="space-y-8">
            <PageHeader
                eyebrow="Lobby browser"
                title="Find a lobby"
                description="Lobbies appear, fill, and disappear here in real time, on the chain you picked."
                action={<CreateLobbyButton>Create lobby</CreateLobbyButton>}
            />
            <Suspense fallback={<LobbyBrowserSkeleton />}>
                <LobbyBrowser initialLobbies={lobbies} games={games} />
            </Suspense>
        </PageContainer>
    )
}
