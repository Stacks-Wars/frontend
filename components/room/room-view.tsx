"use client"

import * as React from "react"
import { RiRefreshLine, RiWifiOffLine } from "@remixicon/react"

import { kickLobbyPlayerAction } from "@/actions/lobbies"
import { SectionHeader } from "@/components/common/section"
import { GameStage } from "@/components/room/game-stage"
import { JoinRequestList } from "@/components/room/join-request-list"
import { MatchResult } from "@/components/room/match-result"
import { PlayerList } from "@/components/room/player-list"
import { RoomChat } from "@/components/room/room-chat"
import { RoomControls } from "@/components/room/room-controls"
import { RoomHeader } from "@/components/room/room-header"
import { RoomSkeleton } from "@/components/room/room-skeleton"
import { Button, EmptyState } from "@/components/ui"
import { getGameModule } from "@/games/registry"
import { useLobbyRoom } from "@/hooks/use-lobby-room"
import type { GameMetadata } from "@/lib/api/types"
import { useNotificationsStore } from "@/stores/notifications"
import { useSessionStore } from "@/stores/session"

/**
 * The realtime hub.
 *
 * Nothing here fetches the lobby: subscribing to `lobbyPath:{path}` makes the
 * server push a snapshot, and every later change arrives as a delta on the same
 * topic. When the status flips to `inProgress` the waiting room is replaced by
 * the game's registered component.
 */
export function RoomView({
    path,
    games,
}: {
    path: string
    games: GameMetadata[]
}) {
    const { room, connection, stale, sendChat, resync, channel } =
        useLobbyRoom(path)
    const selfUserId = useSessionStore((s) => s.user?.id ?? null)
    const toast = useNotificationsStore((s) => s.toast)
    const [kicking, setKicking] = React.useState<string | null>(null)

    const gameId = room?.lobby.gameId
    const game = React.useMemo(
        () => games.find((item) => item.id === gameId) ?? null,
        [games, gameId]
    )

    // Give the socket a moment before declaring the room missing.
    const [waitedTooLong, setWaitedTooLong] = React.useState(false)
    React.useEffect(() => {
        if (room) return
        const timer = window.setTimeout(() => setWaitedTooLong(true), 6000)
        return () => window.clearTimeout(timer)
    }, [room])

    async function kick(userId: string) {
        if (!room) return
        setKicking(userId)
        try {
            const result = await kickLobbyPlayerAction(room.lobby.id, userId)
            if (!result.ok) {
                toast({ title: result.error, tone: "danger" })
            }
        } catch {
            toast({ title: "Could not remove the player", tone: "danger" })
        } finally {
            setKicking(null)
        }
    }

    if (!room) {
        if (waitedTooLong) {
            return (
                <EmptyState
                    icon={<RiWifiOffLine />}
                    title={
                        connection === "open"
                            ? "Lobby not found"
                            : "Still connecting"
                    }
                    description={
                        connection === "open"
                            ? "This lobby may have been closed or the link is wrong."
                            : "Waiting for the realtime connection."
                    }
                    action={
                        <Button variant="outline" onClick={resync}>
                            <RiRefreshLine />
                            Try again
                        </Button>
                    }
                />
            )
        }
        return <RoomSkeleton />
    }

    const { lobby, players, joinRequests, presence, chat, finished } = room
    const isParticipant = players.some((p) => p.userId === selfUserId)
    const isCreator = selfUserId === lobby.creatorId
    const playing = lobby.status === "inProgress" || lobby.status === "starting"
    const registered = getGameModule(lobby.gameId)

    return (
        <div className="space-y-6">
            {stale ? (
                <div className="flex items-center gap-2 rounded-xl border border-warning/40 bg-warning/10 px-4 py-2.5 text-sm text-warning">
                    <RiWifiOffLine className="size-4" />
                    Connection lost — reconnecting. Actions are paused.
                </div>
            ) : null}

            <RoomHeader
                lobby={lobby}
                game={game}
                online={presence.length}
            />

            {finished ? (
                <MatchResult
                    finished={finished}
                    players={players}
                    selfUserId={selfUserId}
                />
            ) : null}

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-6">
                    {playing && channel && !finished ? (
                        <GameStage
                            lobby={lobby}
                            players={players}
                            selfUserId={selfUserId}
                            initialState={room.game?.state ?? null}
                            channel={channel}
                            connection={connection}
                        />
                    ) : (
                        <>
                            <section className="space-y-4">
                                <SectionHeader
                                    title="Lobby"
                                    description={
                                        lobby.status === "waiting"
                                            ? "The match starts when the host says so."
                                            : "Final roster."
                                    }
                                />
                                <PlayerList
                                    players={players}
                                    presence={presence}
                                    selfUserId={selfUserId}
                                    creatorId={lobby.creatorId}
                                    game={game}
                                    canKick={
                                        isCreator && lobby.status === "waiting"
                                    }
                                    kicking={kicking}
                                    onKick={kick}
                                />
                                {isCreator && lobby.isPrivate ? (
                                    <JoinRequestList
                                        lobbyId={lobby.id}
                                        requests={joinRequests}
                                        disabled={lobby.status !== "waiting"}
                                    />
                                ) : null}
                            </section>

                            {registered?.LobbyPanel
                                ? registered.LobbyPanel({
                                      lobby,
                                      players,
                                      selfUserId,
                                  })
                                : null}
                        </>
                    )}

                    {!finished ? (
                        <div className="sticky bottom-4 z-10 rounded-2xl border border-border/70 p-4 shadow-lg shadow-black/30 backdrop-blur surface-raised">
                            <RoomControls
                                lobby={lobby}
                                players={players}
                                joinRequests={joinRequests}
                                selfUserId={selfUserId}
                                game={game}
                                onForfeit={channel?.quit}
                            />
                        </div>
                    ) : null}
                </div>

                <RoomChat
                    messages={chat}
                    selfUserId={selfUserId}
                    canSend={isParticipant && connection === "open"}
                    onSend={sendChat}
                    className="lg:sticky lg:top-24"
                />
            </div>
        </div>
    )
}
