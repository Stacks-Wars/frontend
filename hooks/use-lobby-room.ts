"use client"

import * as React from "react"

import { useAppSocket, useTopic } from "@/components/ws/app-ws-provider"
import { appSocket } from "@/lib/ws/app-socket"
import { subscribeToGameEvents } from "@/lib/ws/game-bus"
import type { GameEvent } from "@/lib/ws/protocol"
import { useLiveStore, type RoomSlice } from "@/stores/live"

export type GameChannel = {
    lobbyId: string
    gameId: string
    /** Send a typed action to the running engine. */
    send: (action: unknown) => void
    /** Forfeit / leave an in-progress match. */
    quit: () => void
    /** Subscribe to engine events for this lobby. */
    on: (handler: (event: GameEvent) => void) => () => void
}

export type LobbyRoom = {
    /** `undefined` until the first snapshot arrives. */
    room: RoomSlice | undefined
    lobbyId: string | undefined
    connection: ReturnType<typeof useAppSocket>
    /** True once the server snapshot has been applied. */
    hydrated: boolean
    /** Connection dropped after we had data — the UI should show a reconnect state. */
    stale: boolean
    sendChat: (body: string) => void
    resync: () => void
    channel: GameChannel | null
}

/**
 * Subscribe-first room state.
 *
 * Subscribing to `lobbyPath:{path}` makes the server resolve the path, join the
 * canonical room topic, and push a full snapshot — so the room never issues an
 * HTTP request, and a reconnect re-snapshots automatically.
 */
export function useLobbyRoom(path: string | null | undefined): LobbyRoom {
    useTopic(path ? `lobbyPath:${path}` : null)

    const connection = useAppSocket()
    const lobbyId = useLiveStore((s) => (path ? s.roomIdByPath[path] : undefined))
    const room = useLiveStore((s) => (lobbyId ? s.rooms[lobbyId] : undefined))

    const sendChat = React.useCallback(
        (body: string) => {
            const trimmed = body.trim()
            if (!lobbyId || !trimmed) return
            appSocket.sendChat(lobbyId, trimmed)
        },
        [lobbyId]
    )

    const resync = React.useCallback(() => {
        if (lobbyId) appSocket.requestLobbySync(lobbyId)
    }, [lobbyId])

    const gameId = room?.lobby.gameId
    const channel = React.useMemo<GameChannel | null>(() => {
        if (!lobbyId || !gameId) return null
        return {
            lobbyId,
            gameId,
            send: (action) => appSocket.sendGameAction(lobbyId, gameId, action),
            quit: () => appSocket.sendGameQuit(lobbyId),
            on: (handler) => subscribeToGameEvents(lobbyId, handler),
        }
    }, [lobbyId, gameId])

    return {
        room,
        lobbyId,
        connection,
        hydrated: Boolean(room),
        stale: Boolean(room) && connection !== "open",
        sendChat,
        resync,
        channel,
    }
}
