import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { RoomView } from "@/components/room/room-view"
import { getLobbyByPath, listGames } from "@/lib/api/server"
import {
    SITE_NAME,
    siteOgImages,
    siteOrigin,
    siteTwitterImages,
} from "@/lib/seo"

type Params = { params: Promise<{ path: string }> }

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

    return {
        title,
        description,
        robots: { index: false, follow: true },
        openGraph: {
            title,
            description,
            url: `${siteOrigin()}/room/${path}`,
            type: "website",
            images: siteOgImages(gameName ?? SITE_NAME),
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            images: siteTwitterImages(),
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
