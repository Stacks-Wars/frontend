"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"

import { playSfx } from "@/lib/audio/play-sound"
import { appSocket } from "@/lib/ws/app-socket"
import { emitGameEvent } from "@/lib/ws/game-bus"
import {
    APP_TOPIC,
    chainFeedTopic,
    asGameEvent,
    lobbyTopic,
    payloadAs,
    userTopic,
    type GameActivityPayload,
    type LobbyFinishedPayload,
    type LobbyNoticePayload,
    type LobbyPresencePayload,
    type LobbySnapshotPayload,
    type LobbyStatePayload,
    type MatchFinishedPayload,
    type WalletBalancePayload,
    type WalletTxPayload,
    type WsEnvelope,
} from "@/lib/ws/protocol"
import type { Lobby, LobbyChatMessage } from "@/lib/api/types"
import { useConnectionActions, useConnectionStatus } from "@/stores/connection"
import { useLiveStore } from "@/stores/live"
import { useNotificationsStore } from "@/stores/notifications"
import { useSessionCurrentChain, useSessionStore } from "@/stores/session"

/**
 * Access tokens are minted by the auth provider, which rate limits. One mint
 * is shared by every caller for a minute, and concurrent callers wait on the
 * same promise.
 */
const TOKEN_TTL_MS = 60_000
let cachedToken: { value: string; expires: number } | null = null
let tokenInFlight: Promise<string | null> | null = null

async function mintAccessToken(): Promise<string | null> {
    if (cachedToken && cachedToken.expires > Date.now()) {
        return cachedToken.value
    }
    if (tokenInFlight) return tokenInFlight

    tokenInFlight = (async () => {
        try {
            const { getAccessTokenAction } = await import(
                "@/actions/auth-token"
            )
            const token = await getAccessTokenAction()
            cachedToken = { value: token, expires: Date.now() + TOKEN_TTL_MS }
            return token
        } catch {
            cachedToken = null
            return null
        } finally {
            tokenInFlight = null
        }
    })()

    return tokenInFlight
}

/** Drops the cached token so the next mint reflects a new session. */
export function clearAccessTokenCache(): void {
    cachedToken = null
}

/**
 * Opens the single `/app` socket and routes every server message into the
 * live store, the session store, or the game bus. Nothing else in the app
 * parses WebSocket frames.
 */
export function AppWsProvider({ children }: { children?: React.ReactNode }) {
    const queryClient = useQueryClient()
    const { setStatus } = useConnectionActions()
    const currentChain = useSessionCurrentChain()
    useTopic(chainFeedTopic(currentChain))

    React.useEffect(() => {
        appSocket.setTokenProvider(mintAccessToken)
        appSocket.connect()

        const offStatus = appSocket.onStatus(setStatus)
        const offMessage = appSocket.onMessage((message: WsEnvelope) => {
            const live = useLiveStore.getState().actions
            const session = useSessionStore.getState().actions
            const notify = useNotificationsStore.getState().actions

            switch (message.kind) {
                case "lobby.snapshot": {
                    live.applySnapshot(payloadAs<LobbySnapshotPayload>(message))
                    break
                }
                case "lobby.state": {
                    live.applyRoomState(payloadAs<LobbyStatePayload>(message))
                    break
                }
                case "lobby.presence": {
                    live.applyPresence(payloadAs<LobbyPresencePayload>(message))
                    break
                }
                case "lobby.chat": {
                    live.appendChat(payloadAs<LobbyChatMessage>(message))
                    break
                }
                case "lobby.notice": {
                    handleNotice(payloadAs<LobbyNoticePayload>(message), notify)
                    break
                }
                case "lobby.event": {
                    const parsed = asGameEvent(message.payload)
                    if (parsed) emitGameEvent(parsed.lobbyId, parsed.event)
                    break
                }
                case "user.event": {
                    const parsed = asGameEvent(message.payload)
                    if (parsed) emitGameEvent(parsed.lobbyId, parsed.event)
                    break
                }
                case "lobby.finished": {
                    const payload = payloadAs<LobbyFinishedPayload>(message)
                    live.applyFinished(payload)
                    live.removeLobby(payload.lobbyId)
                    playSfx("end")
                    notify.toast({
                        title: "Match finished",
                        tone: "success",
                        silent: true,
                    })
                    notify.push({
                        title: "Match finished",
                        href: `/room/${payload.lobbyPath}`,
                    })
                    break
                }

                case "lobby.created": {
                    const { lobby } = payloadAs<{ lobby: Lobby }>(message)
                    live.upsertLobby(lobby)
                    break
                }
                case "lobby.updated": {
                    const { lobby } = payloadAs<{ lobby: Lobby }>(message)
                    live.upsertLobby(lobby)
                    break
                }
                case "lobby.removed": {
                    const { lobbyId } = payloadAs<{ lobbyId: string }>(message)
                    live.removeLobby(lobbyId)
                    break
                }
                case "games.activity": {
                    live.setActivity(
                        payloadAs<GameActivityPayload>(message).games
                    )
                    break
                }
                case "leaderboard.updated": {
                    live.bumpLeaderboard()
                    break
                }
                case "match.finished": {
                    live.pushResult(payloadAs<MatchFinishedPayload>(message))
                    break
                }

                case "wallet.balance.updated": {
                    const payload = payloadAs<WalletBalancePayload>(message)
                    if (typeof payload.availableMicro === "number") {
                        session.patchBalance({
                            availableMicro: payload.availableMicro,
                            ...(payload.chain
                                ? {
                                      chain: payload.chain as import("@/lib/chain").ChainId,
                                  }
                                : {}),
                            ...(payload.address
                                ? { address: payload.address }
                                : payload.stxAddress
                                  ? { address: payload.stxAddress }
                                  : {}),
                        })
                    }
                    void queryClient.invalidateQueries({
                        queryKey: ["activity"],
                    })
                    if (typeof payload.payoutMicro === "number") {
                        notify.toast({
                            title: "Winnings received",
                            body: "It's in your wallet.",
                            tone: "success",
                        })
                        notify.push({
                            title: "Match reward claimed",
                            href: "/wallet",
                        })
                    }
                    break
                }
                case "wallet.tx.updated": {
                    const payload = payloadAs<WalletTxPayload>(message)
                    void queryClient.invalidateQueries({
                        queryKey: ["activity"],
                    })
                    if (payload.status === "confirmed") {
                        notify.toast({
                            title: "Transaction confirmed",
                            tone: "success",
                        })
                    } else if (payload.status === "failed") {
                        notify.toast({
                            title: "Transaction failed",
                            tone: "danger",
                        })
                    }
                    break
                }

                default:
                    break
            }
        })

        const releaseApp = appSocket.acquireTopic(APP_TOPIC)

        return () => {
            releaseApp()
            offStatus()
            offMessage()
            appSocket.disconnect()
        }
    }, [queryClient, setStatus])

    return children
}

function handleNotice(
    notice: LobbyNoticePayload,
    notify: ReturnType<typeof useNotificationsStore.getState>["actions"]
) {
    if (notice.type === "gameStarted") {
        playSfx("beep")
        notify.toast({
            title: "Match starting",
            tone: "success",
            silent: true,
        })
    }
}

export function useAppSocket() {
    return useConnectionStatus()
}

/**
 * Hold a topic subscription for the component's lifetime. Reference counted,
 * so several components can watch the same topic safely.
 */
export function useTopic(topic: string | null | undefined): void {
    React.useEffect(() => {
        if (!topic) return
        return appSocket.acquireTopic(topic)
    }, [topic])
}

export function useLobbyTopic(lobbyId: string | null | undefined): void {
    useTopic(lobbyId ? lobbyTopic(lobbyId) : null)
}

export function useUserTopic(userId: string | null | undefined): void {
    useTopic(userId ? userTopic(userId) : null)
}
