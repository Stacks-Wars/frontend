import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { RoomView } from "@/components/room/room-view"
import { getLobbyByPath, listGames } from "@/lib/api/server"

type Params = { params: Promise<{ path: string }> }

function appOrigin(): string {
    return (
        process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
        "https://stackswars.com"
    )
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
        : "Competitive Stacks arena lobby."

    const image = gameOgImage(lobby?.gameId)

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `${appOrigin()}/room/${path}`,
            type: "website",
            images: [{ url: image, alt: gameName ?? "Stacks Wars" }],
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
