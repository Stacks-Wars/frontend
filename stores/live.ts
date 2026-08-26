"use client"

import { create } from "zustand"

import type {
    GameActivity,
    Lobby,
    LobbyChatMessage,
    LobbyState,
    LobbyStatus,
    PlayerState,
    JoinRequest,
} from "@/lib/api/types"
import { lobbyVisibleOnChain, type ChainId } from "@/lib/chain"
import type {
    GameSnapshot,
    LobbyFinishedPayload,
    LobbyPresencePayload,
    LobbySnapshotPayload,
    LobbyStatePayload,
    MatchFinishedPayload,
} from "@/lib/ws/protocol"

/** Chat lines kept in memory per room. */
const CHAT_LIMIT = 120
/** Recent results kept for the landing ticker. */
const RESULTS_LIMIT = 20

export type RoomSlice = {
    lobbyId: string
    lobby: Lobby
    state: LobbyState | null
    players: PlayerState[]
    joinRequests: JoinRequest[]
    presence: string[]
    chat: LobbyChatMessage[]
    game: GameSnapshot | null
    finished: LobbyFinishedPayload | null
    /** Set once the first snapshot lands, so the UI can stop showing skeletons. */
    hydratedAt: number
}

type LiveActions = {
    applySnapshot: (payload: LobbySnapshotPayload) => void
    applyRoomState: (payload: LobbyStatePayload) => void
    applyPresence: (payload: LobbyPresencePayload) => void
    appendChat: (message: LobbyChatMessage) => void
    applyGameState: (lobbyId: string, game: GameSnapshot) => void
    applyFinished: (payload: LobbyFinishedPayload) => void
    clearRoom: (lobbyId: string) => void

    seedLobbies: (lobbies: Lobby[], replace?: boolean) => void
    upsertLobby: (lobby: Lobby) => void
    removeLobby: (lobbyId: string) => void
    pruneFeedForChain: (chain: ChainId) => void

    setActivity: (items: GameActivity[]) => void
    bumpLeaderboard: () => void
    pushResult: (result: MatchFinishedPayload) => void
}

type LiveState = {
    /** Rooms keyed by lobby id, plus a path → id index for routing. */
    rooms: Record<string, RoomSlice>
    roomIdByPath: Record<string, string>

    /** Global lobby browser feed. */
    lobbies: Record<string, Lobby>
    /**
     * Lobbies the server told us to drop. Kept so a server-rendered list that
     * still contains them can't resurrect a finished lobby.
     */
    removedLobbies: Record<string, true>

    /** Per-game live counters. */
    activity: Record<string, GameActivity>

    /** Bumped whenever the server says rankings moved. */
    leaderboardVersion: number

    recentResults: MatchFinishedPayload[]

    actions: LiveActions
}

function sortPlayers(players: PlayerState[]): PlayerState[] {
    return [...players].sort((a, b) => a.joinedAt - b.joinedAt)
}

/** Patch rank / prize / points from `lobby.finished.standings` onto the roster. */
function mergeFinishedStandings(
    players: PlayerState[],
    finished: LobbyFinishedPayload
): PlayerState[] {
    const standings = finished.standings
    if (!standings?.length) {
        // Older payloads: at least mark winners as rank 1 so the podium isn't random.
        if (!finished.winners.length) return players
        const winners = new Set(finished.winners)
        return players.map((player) =>
            winners.has(player.userId) && player.rank == null
                ? { ...player, rank: 1 }
                : player
        )
    }

    const byUser = new Map(standings.map((row) => [row.userId, row]))
    return players.map((player) => {
        const row = byUser.get(player.userId)
        if (!row) return player
        return {
            ...player,
            rank: row.rank ?? player.rank,
            prizeMicro:
                row.prizeMicro !== undefined
                    ? row.prizeMicro
                    : player.prizeMicro,
            warsPoint:
                row.warsPoint !== undefined ? row.warsPoint : player.warsPoint,
        }
    })
}

export const useLiveStore = create<LiveState>((set) => ({
    rooms: {},
    roomIdByPath: {},
    lobbies: {},
    removedLobbies: {},
    activity: {},
    leaderboardVersion: 0,
    recentResults: [],

    actions: {
        applySnapshot: (payload) =>
            set((current) => {
                const lobbyId = payload.lobby.id
                const previous = current.rooms[lobbyId]
                return {
                    rooms: {
                        ...current.rooms,
                        [lobbyId]: {
                            lobbyId,
                            lobby: payload.lobby,
                            state: payload.state,
                            players: sortPlayers(payload.players),
                            joinRequests: payload.joinRequests ?? [],
                            presence: payload.presence,
                            chat: payload.chat.slice(-CHAT_LIMIT),
                            game: payload.game,
                            finished:
                                payload.finished ?? previous?.finished ?? null,
                            hydratedAt: Date.now(),
                        },
                    },
                    roomIdByPath: {
                        ...current.roomIdByPath,
                        [payload.lobby.path]: lobbyId,
                    },
                    lobbies: { ...current.lobbies, [lobbyId]: payload.lobby },
                }
            }),

        applyRoomState: (payload) =>
            set((current) => {
                const lobbyId = payload.lobby.id
                const previous = current.rooms[lobbyId]
                if (!previous) return current
                return {
                    rooms: {
                        ...current.rooms,
                        [lobbyId]: {
                            ...previous,
                            lobby: payload.lobby,
                            state: payload.state,
                            players: sortPlayers(payload.players),
                            joinRequests:
                                payload.joinRequests ?? previous.joinRequests,
                        },
                    },
                }
            }),

        applyPresence: (payload) =>
            set((current) => {
                const previous = current.rooms[payload.lobbyId]
                if (!previous) return current
                return {
                    rooms: {
                        ...current.rooms,
                        [payload.lobbyId]: {
                            ...previous,
                            presence: payload.online,
                        },
                    },
                }
            }),

        appendChat: (message) =>
            set((current) => {
                const previous = current.rooms[message.lobbyId]
                if (!previous) return current
                if (previous.chat.some((line) => line.id === message.id)) {
                    return current
                }
                return {
                    rooms: {
                        ...current.rooms,
                        [message.lobbyId]: {
                            ...previous,
                            chat: [...previous.chat, message].slice(
                                -CHAT_LIMIT
                            ),
                        },
                    },
                }
            }),

        applyGameState: (lobbyId, game) =>
            set((current) => {
                const previous = current.rooms[lobbyId]
                if (!previous) return current
                return {
                    rooms: {
                        ...current.rooms,
                        [lobbyId]: { ...previous, game },
                    },
                }
            }),

        applyFinished: (payload) =>
            set((current) => {
                const previous = current.rooms[payload.lobbyId]
                if (!previous) return current
                const finishedStatus: LobbyStatus = "finished"
                return {
                    rooms: {
                        ...current.rooms,
                        [payload.lobbyId]: {
                            ...previous,
                            finished: payload,
                            players: mergeFinishedStandings(
                                previous.players,
                                payload
                            ),
                            lobby: {
                                ...previous.lobby,
                                status: finishedStatus,
                            },
                            state: previous.state
                                ? { ...previous.state, status: finishedStatus }
                                : previous.state,
                        },
                    },
                }
            }),

        clearRoom: (lobbyId) =>
            set((current) => {
                if (!current.rooms[lobbyId]) return current
                const rooms = { ...current.rooms }
                const path = rooms[lobbyId]?.lobby.path
                delete rooms[lobbyId]
                const roomIdByPath = { ...current.roomIdByPath }
                if (path) delete roomIdByPath[path]
                return { rooms, roomIdByPath }
            }),

        /**
         * Merge a server-rendered list into the feed. Pages that only know about a
         * slice of lobbies (a single game, say) merge; the browser, which fetches
         * everything, replaces so stale rows are dropped.
         */
        seedLobbies: (lobbies, replace = false) =>
            set((current) => {
                const seeded = Object.fromEntries(
                    lobbies
                        .filter((lobby) => !current.removedLobbies[lobby.id])
                        .map((lobby) => [lobby.id, lobby])
                )
                return {
                    lobbies: replace
                        ? seeded
                        : { ...current.lobbies, ...seeded },
                }
            }),

        upsertLobby: (lobby) =>
            set((current) => {
                const removedLobbies = { ...current.removedLobbies }
                delete removedLobbies[lobby.id]
                return {
                    lobbies: { ...current.lobbies, [lobby.id]: lobby },
                    removedLobbies,
                }
            }),

        removeLobby: (lobbyId) =>
            set((current) => {
                const lobbies = { ...current.lobbies }
                delete lobbies[lobbyId]
                return {
                    lobbies,
                    removedLobbies: {
                        ...current.removedLobbies,
                        [lobbyId]: true as const,
                    },
                }
            }),

        pruneFeedForChain: (chain) =>
            set((current) => {
                const lobbies = { ...current.lobbies }
                for (const [id, lobby] of Object.entries(lobbies)) {
                    if (!lobbyVisibleOnChain(lobby, chain)) {
                        delete lobbies[id]
                    }
                }
                return { lobbies }
            }),

        setActivity: (items) =>
            set(() => ({
                activity: Object.fromEntries(
                    items.map((item) => [item.gameId, item])
                ),
            })),

        bumpLeaderboard: () =>
            set((current) => ({
                leaderboardVersion: current.leaderboardVersion + 1,
            })),

        pushResult: (result) =>
            set((current) => ({
                recentResults: [result, ...current.recentResults].slice(
                    0,
                    RESULTS_LIMIT
                ),
            })),
    },
}))

export const useLiveActions = () => useLiveStore((s) => s.actions)
export const useLeaderboardVersion = () =>
    useLiveStore((s) => s.leaderboardVersion)
export const useRecentResults = () => useLiveStore((s) => s.recentResults)
