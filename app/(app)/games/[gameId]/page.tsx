import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { PageContainer } from "@/components/common/page-container"
import { GamePageResolver } from "@/components/games/game-page-resolver"
import { JsonLd } from "@/components/seo/json-ld"
import type { GameActivity } from "@/lib/api/types"
import { getGame, listGameActivity, listLobbies } from "@/lib/api/server"
import { lobbyListChainForSession } from "@/lib/chain/server"
import {
    breadcrumbJsonLd,
    gameMetaDescription,
    SITE_NAME,
    siteOrigin,
    videoGameJsonLd,
} from "@/lib/seo"

type Params = { params: Promise<{ gameId: string }> }

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { gameId } = await params
    const game = await getGame(gameId).catch(() => null)
    if (!game) return { title: "Game" }
    const description = gameMetaDescription(game)
    const url = `/games/${gameId}`
    return {
        title: game.name,
        description,
        alternates: { canonical: url },
        openGraph: {
            title: `${game.name} · ${SITE_NAME}`,
            description,
            url,
            type: "website",
            images: [
                { url: `${siteOrigin()}/games/${gameId}.png`, alt: game.name },
            ],
        },
        twitter: {
            card: "summary_large_image",
            title: `${game.name} · ${SITE_NAME}`,
            description,
            images: [`${siteOrigin()}/games/${gameId}.png`],
        },
    }
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

    const chain = await lobbyListChainForSession()
    const [activity, lobbies, recentFinished] = await Promise.all([
        listGameActivity().catch(() => []),
        listLobbies({
            gameId,
            limit: 48,
            ...(chain ? { chain } : {}),
        }).catch(() => []),
        // Both chains, finished only — `updated_at` recency is server-side.
        listLobbies({
            gameId,
            status: ["finished"],
            limit: 12,
        }).catch(() => []),
    ])

    return (
        <PageContainer size="wide">
            <JsonLd data={videoGameJsonLd(game)} />
            <JsonLd
                data={breadcrumbJsonLd([
                    { name: "Home", path: "/" },
                    { name: "Games", path: "/games" },
                    { name: game.name, path: `/games/${game.id}` },
                ])}
            />
            <GamePageResolver
                game={game}
                activity={
                    activity.find((item) => item.gameId === gameId) ??
                    emptyActivity(gameId)
                }
                lobbies={lobbies}
                recentFinished={recentFinished}
            />
        </PageContainer>
    )
}
