"use client"

import * as React from "react"

import type { Lobby, LobbyStatus } from "@/lib/api/types"
import { lobbyVisibleOnChain, type ChainId } from "@/lib/chain"
import { useLiveActions, useLiveStore } from "@/stores/live"
import { useSessionCurrentChain, useSessionUser } from "@/stores/session"

export type LobbyFilters = {
    gameId?: string | null
    statuses?: LobbyStatus[]
    entry?: "all" | "free" | "paid"
    creatorId?: string | null
    minPlayers?: number | null
    maxPlayers?: number | null
    search?: string
}

export type LobbySort = "newest" | "pot" | "players" | "filling"

const STATUS_WEIGHT: Record<LobbyStatus, number> = {
    waiting: 0,
    starting: 1,
    inProgress: 2,
    finished: 3,
}

function matches(
    lobby: Lobby,
    filters: LobbyFilters,
    chain: ChainId | null
): boolean {
    if (chain && !lobbyVisibleOnChain(lobby, chain)) {
        return false
    }
    if (filters.gameId && lobby.gameId !== filters.gameId) return false
    if (filters.statuses?.length && !filters.statuses.includes(lobby.status)) {
        return false
    }
    if (filters.entry === "free" && lobby.entryAmountMicro > 0) return false
    if (filters.entry === "paid" && lobby.entryAmountMicro === 0) return false
    if (filters.creatorId && lobby.creatorId !== filters.creatorId) return false

    const players = lobby.participants.length
    if (filters.minPlayers != null && players < filters.minPlayers) return false
    if (filters.maxPlayers != null && players > filters.maxPlayers) return false

    const search = filters.search?.trim().toLowerCase()
    if (search) {
        const haystack = `${lobby.name} ${lobby.path} ${lobby.gameId}`.toLowerCase()
        if (!haystack.includes(search)) return false
    }
    return true
}

function compare(a: Lobby, b: Lobby, sort: LobbySort): number {
    switch (sort) {
        case "pot":
            return b.potMicro - a.potMicro
        case "players":
            return b.participants.length - a.participants.length
        case "filling":
            return (
                STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status] ||
                b.participants.length - a.participants.length
            )
        case "newest":
        default:
            return (
                STATUS_WEIGHT[a.status] - STATUS_WEIGHT[b.status] ||
                Date.parse(b.createdAt) - Date.parse(a.createdAt)
            )
    }
}

/**
 * Live lobby list. Seeded once from the server render, then kept current by
 * `lobby.created` / `lobby.updated` / `lobby.removed` on `app:{chain}` (signed
 * in) or `app:all` (guest). Guests skip the chain visibility filter so both
 * settlement chains show. Paid events never arrive on the other chain's topic;
 * the visibility check is only a safety net for SSR merge after login.
 */
export function useLobbyFeed(
    initial: Lobby[],
    filters: LobbyFilters = {},
    sort: LobbySort = "newest",
    options: { authoritative?: boolean } = {}
) {
    const lobbies = useLiveStore((s) => s.lobbies)
    const removed = useLiveStore((s) => s.removedLobbies)
    const { seedLobbies } = useLiveActions()

    // The server render is the starting point; WS deltas take it from there.
    React.useEffect(() => {
        seedLobbies(initial, options.authoritative ?? false)
    }, [initial, seedLobbies, options.authoritative])

    // Merge on read too, so the first paint isn't empty while the effect runs.
    const all = React.useMemo(() => {
        const merged = new Map<string, Lobby>()
        for (const lobby of initial) {
            if (!removed[lobby.id]) merged.set(lobby.id, lobby)
        }
        for (const lobby of Object.values(lobbies)) {
            merged.set(lobby.id, lobby)
        }
        return Array.from(merged.values())
    }, [initial, lobbies, removed])

    // Spread into primitives so callers can pass an inline filter object.
    const {
        gameId = null,
        entry = "all",
        creatorId = null,
        minPlayers = null,
        maxPlayers = null,
        search = "",
    } = filters
    const user = useSessionUser()
    const currentChain = useSessionCurrentChain()
    const visibilityChain = user ? currentChain : null
    const statusKey = filters.statuses?.join(",") ?? ""

    const visible = React.useMemo(() => {
        const active: LobbyFilters = {
            gameId,
            entry,
            creatorId,
            minPlayers,
            maxPlayers,
            search,
            statuses: statusKey
                ? (statusKey.split(",") as LobbyStatus[])
                : undefined,
        }
        return all
            .filter((lobby) => matches(lobby, active, visibilityChain))
            .sort((a, b) => compare(a, b, sort))
    }, [
        all,
        sort,
        gameId,
        entry,
        creatorId,
        minPlayers,
        maxPlayers,
        search,
        statusKey,
        visibilityChain,
    ])

    return { lobbies: visible, total: all.length }
}
