"use client"

import { EmptyState } from "@/components/ui"
import { getGameModule } from "@/games/registry"
import type { GameChannel } from "@/hooks/use-lobby-room"
import type { ConnectionStatus } from "@/lib/ws/app-socket"
import type { Lobby, PlayerState } from "@/lib/api/types"

/**
 * Hands the running match to whichever component the game registered. A game
 * without a module still shows a usable room; it just has no board.
 */
export function GameStage({
    lobby,
    players,
    selfUserId,
    initialState,
    channel,
    connection,
}: {
    lobby: Lobby
    players: PlayerState[]
    selfUserId: string | null
    initialState: unknown
    channel: GameChannel
    connection: ConnectionStatus
}) {
    const registered = getGameModule(lobby.gameId)

    if (!registered) {
        return (
            <EmptyState
                title="No client for this game yet"
                description={`"${lobby.gameId}" runs on the server but has no registered UI. Results still settle normally.`}
            />
        )
    }

    return registered.Room({
        lobby,
        players,
        selfUserId,
        initialState,
        channel,
        connection,
    })
}
