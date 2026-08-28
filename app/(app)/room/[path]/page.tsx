import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { RoomView } from "@/components/room/room-view"
import { getLobbyByPath, listGames } from "@/lib/api/server"
import { SITE_NAME, siteOrigin } from "@/lib/seo"

type Params = { params: Promise<{ path: string }> }

function appOrigin(): string {
    return siteOrigin()
}

/** Prefer game-specific art; OG crawlers get an absolute URL. */
function gameOgImage(gameId: string | undefined): string {
    const origin = appOrigin()
    if (gameId) {
        return `${origin}/games/${gameId}.png`
    }
    return `${origin}/opengraph-image`
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
    const { path } = await params
    const detail = await getLobbyByPath(path).catch(() => null)
    const lobby = detail?.lobby
    const games = await listGames().catch(() => [])
    const gameName =
        games.find((g) => g.id === lobby?.gameId)?.name ?? lobby?.gameId

    const title = lobby?.name?.trim() || "Lobby"
    const description = lobby
        ? `${gameName ?? "Stacks Wars"} lobby${
              lobby.entryAmountMicro > 0
                  ? lobby.isSponsored
                      ? " · Sponsored"
                      : " · Paid"
                  : " · Free"
          }`
        : "Onchain game lobby."

    const image = gameOgImage(lobby?.gameId)

    return {
        title,
        description,
        robots: { index: false, follow: true },
        openGraph: {
            title,
            description,
            url: `${appOrigin()}/room/${path}`,
            type: "website",
            images: [{ url: image, alt: gameName ?? SITE_NAME }],
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: [image],
        },
    }
}

/**
 * The room deliberately fetches no lobby data for the view itself. `RoomView`
 * subscribes over the socket; metadata above uses a one-shot path lookup for
 * link previews (Telegram / OG).
 */
export default async function RoomPage({ params }: Params) {
    const { path } = await params
    const games = await listGames().catch(() => [])

    return (
        <PageContainer size="wide">
            <RoomView path={path} games={games} />
        </PageContainer>
    )
}
