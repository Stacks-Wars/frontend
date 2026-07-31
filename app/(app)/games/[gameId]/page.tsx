import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/common/page-container"
import { GamePageResolver } from "@/components/games/game-page-resolver"
import type { GameActivity } from "@/lib/api/types"
import {
    getGame,
    listGameActivity,
    listLobbies,
    listRecentMatches,
} from "@/lib/api/server"

type Params = { params: Promise<{ gameId: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { gameId } = await params
    const game = await getGame(gameId).catch(() => null)
    if (!game) return { title: "Game" }
    return { title: game.name, description: game.description }
}

function emptyActivity(gameId: string): GameActivity {
    return {
        gameId,
        waitingLobbies: 0,
        liveLobbies: 0,
        activePlayers: 0,
        openPotMicro: 0,
    }
}

export default async function GameDetailPage({ params }: Params) {
    const { gameId } = await params
    const game = await getGame(gameId)
    if (!game) notFound()

    const [activity, lobbies, recentMatches] = await Promise.all([
        listGameActivity().catch(() => []),
        listLobbies({ gameId, limit: 48 }).catch(() => []),
        listRecentMatches({ gameId, limit: 8 }).catch(() => []),
    ])

    return (
        <PageContainer size="wide">
            <GamePageResolver
                game={game}
                activity={
                    activity.find((item) => item.gameId === gameId) ??
                    emptyActivity(gameId)
                }
                lobbies={lobbies}
                recentMatches={recentMatches}
            />
        </PageContainer>
    )
}
