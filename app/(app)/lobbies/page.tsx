import type { Metadata } from "next"
import { Suspense } from "react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/section"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { LobbyBrowser } from "@/components/lobbies/lobby-browser"
import { Skeleton } from "@/components/ui"
import { listGames, listLobbies } from "@/lib/api/server"
import { lobbyListChainForSession } from "@/lib/chain/server"

export const metadata: Metadata = {
    title: "Lobbies",
    description:
        "Open and live multiplayer lobbies. Lobbies are grouped by the chain you are playing on.",
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
            <Suspense fallback={<BrowserSkeleton />}>
                <LobbyBrowser initialLobbies={lobbies} games={games} />
            </Suspense>
        </PageContainer>
    )
}

function BrowserSkeleton() {
    return (
        <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
            <Skeleton className="hidden h-96 rounded-2xl lg:block" />
            <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                    <Skeleton key={index} className="h-56 rounded-2xl" />
                ))}
            </div>
        </div>
    )
}
