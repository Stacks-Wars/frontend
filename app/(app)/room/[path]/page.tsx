import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { RoomView } from "@/components/room/room-view"
import { listGames } from "@/lib/api/server"

export const metadata: Metadata = {
    title: "Lobby",
}

type Params = { params: Promise<{ path: string }> }

/**
 * The room deliberately fetches no lobby data. `RoomView` subscribes over the
 * socket and renders from the snapshot the server pushes back; only the game
 * catalogue (which is static) is loaded here.
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
