/** Shared app WebSocket envelope — mirrors backend `ws::protocol`. */

import type {
    ChainActivityItem,
    Lobby,
    LobbyChatMessage,
    LobbyState,
    PlayerState,
    JoinRequest,
    VaultClaimIntent,
} from "@/lib/api/types"

import type { ChainId } from "@/lib/chain"

export const APP_TOPIC = "app"

/** Every lobby list delta (paid + free, every chain). Guests subscribe here. */
export const ALL_FEED_TOPIC = "app:all"

/** Paid lobby deltas for one settlement chain. Free lobbies dual-publish. */
export function chainFeedTopic(chain: ChainId): string {
    return `app:${chain}`
}

export type WsEnvelope = {
    kind: string
    payload: Record<string, unknown>
}

export type ClientMessage =
    | { kind: "auth"; payload: { token: string } }
    | { kind: "subscribe"; payload: { topic: string } }
    | { kind: "unsubscribe"; payload: { topic: string } }
    | { kind: "ping"; payload: Record<string, never> }
    | { kind: "lobby.sync"; payload: { lobbyId: string } }
    | { kind: "game.quit"; payload: { lobbyId: string } }
    | { kind: "chat.send"; payload: { lobbyId: string; body: string } }
    | {
          kind: "game.action"
          payload: { lobbyId: string; gameId: string; action: unknown }
      }

export type ServerKind =
    // connection lifecycle
    | "connected"
    | "authenticated"
    | "subscribed"
    | "unsubscribed"
    | "pong"
    | "error"
    // room
    | "lobby.snapshot"
    | "lobby.state"
    | "lobby.presence"
    | "lobby.chat"
    | "lobby.notice"
    | "lobby.event"
    | "lobby.finished"
    // global feed
    | "lobby.created"
    | "lobby.updated"
    | "lobby.removed"
    | "games.activity"
    | "leaderboard.updated"
    | "match.finished"
    // private
    | "user.event"
    | "wallet.balance.updated"
    | "wallet.tx.updated"

export function lobbyTopic(lobbyId: string) {
    return `lobby:${lobbyId}`
}

export function userTopic(userId: string) {
    return `user:${userId}`
}

export function isWsEnvelope(value: unknown): value is WsEnvelope {
    if (!value || typeof value !== "object") return false
    const record = value as Record<string, unknown>
    return (
        typeof record.kind === "string" &&
        typeof record.payload === "object" &&
        record.payload !== null
    )
}

/* ------------------------------------------------------------------ */
/* Server payload shapes                                               */
/* ------------------------------------------------------------------ */

/** Engine view attached to a room snapshot. */
export type GameSnapshot = {
    gameId: string
    running: boolean
    state: unknown
}

/** Everything needed to render a room without an HTTP fetch. */
export type LobbySnapshotPayload = {
    lobby: Lobby
    state: LobbyState | null
    players: PlayerState[]
    joinRequests: JoinRequest[]
    presence: string[]
    chat: LobbyChatMessage[]
    game: GameSnapshot | null
    /** Restored on revisit when the lobby has already settled. */
    finished?: LobbyFinishedPayload | null
}

export type LobbyStatePayload = {
    reason: string
    lobby: Lobby
    state: LobbyState | null
    players: PlayerState[]
    joinRequests: JoinRequest[]
}

export type LobbyPresencePayload = {
    lobbyId: string
    online: string[]
}

export type LobbyNoticePayload =
    | { type: "playerJoined"; userId: string; username?: string | null; displayName?: string | null }
    | { type: "playerLeft"; userId: string }
    | { type: "playerKicked"; userId: string; byUserId: string }
    | { type: "playerReady"; userId: string; ready: boolean }
    | { type: "gameStarted"; gameId: string }

/** Rank/prize/points carried on `lobby.finished` so live UI doesn't wait for a refresh. */
export type FinishedStanding = {
    userId: string
    rank: number
    prizeMicro?: number | null
    warsPoint?: number | null
}

export type LobbyFinishedPayload = {
    lobbyId: string
    lobbyPath: string
    matchId: string
    winners: string[]
    needsOnChainClaim: boolean
    claims: VaultClaimIntent[]
    /** Ordered final standings; present on new finishes, optional on older Redis payloads. */
    standings?: FinishedStanding[]
}

export type GameActivityPayload = {
    games: Array<{
        gameId: string
        waitingLobbies: number
        liveLobbies: number
        activePlayers: number
        openPotMicro: number
    }>
}

export type MatchFinishedPayload = {
    matchId: string
    lobbyId: string
    lobbyPath: string
    gameId: string
    potMicro: number
    winners: string[]
}

export type WalletBalancePayload = {
    availableMicro: number
    address?: string
    chain?: string
    payoutMicro?: number
}

export type WalletTxPayload = {
    txid: string
    status: ChainActivityItem["status"]
    kind?: ChainActivityItem["kind"]
    amountMicro?: number
}

/**
 * Engine events arrive on `lobby.event` (public) and `user.event` (private),
 * wrapped with routing metadata. `event` is the engine's own JSON, always
 * tagged with a `type` field.
 */
export type GameEventEnvelope = {
    lobbyId: string
    gameId: string
    event: GameEvent
}

export type GameEvent = {
    type: string
    [key: string]: unknown
}

export function asGameEvent(
    payload: Record<string, unknown>
): GameEventEnvelope | null {
    if (typeof payload.lobbyId !== "string") return null
    if (typeof payload.gameId !== "string") return null
    const event = payload.event
    if (!event || typeof event !== "object") return null
    if (typeof (event as Record<string, unknown>).type !== "string") return null
    return {
        lobbyId: payload.lobbyId,
        gameId: payload.gameId,
        event: event as GameEvent,
    }
}

/** Narrow an envelope payload to a known shape without runtime validation. */
export function payloadAs<T>(envelope: WsEnvelope): T {
    return envelope.payload as T
}
