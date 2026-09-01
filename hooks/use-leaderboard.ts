"use client"

import { useQuery } from "@tanstack/react-query"
import * as React from "react"

import { getLeaderboardAction } from "@/actions/games"
import type {
    LeaderboardBoard,
    LeaderboardEntry,
    LeaderboardPage,
} from "@/lib/api/types"
import { useLeaderboardVersion } from "@/stores/live"

export type Scope = {
    seasonId?: number
    gameId?: string
    board?: LeaderboardBoard
}

export type RankedEntry = LeaderboardEntry & {
    /** Positions gained since the last fetch. Negative means dropped. */
    movement: number
}

const PAGE_SIZE = 25

/**
 * Ranks from the previous fetch of each scope. The server only tells us that
 * rankings moved, so arrows are derived by diffing consecutive pages. Kept
 * outside React so navigating away and back does not lose the comparison.
 */
const lastRanks = new Map<string, Map<string, number>>()

function scopeKey(scope: Scope): string {
    return `${scope.board ?? "game"}:${scope.seasonId ?? "all"}:${scope.gameId ?? "all"}`
}

function withMovement(key: string, items: LeaderboardEntry[]): RankedEntry[] {
    const previous = lastRanks.get(key)
    const ranked = items.map((entry) => ({
        ...entry,
        movement: previous?.has(entry.userId)
            ? (previous.get(entry.userId) as number) - entry.rank
            : 0,
    }))
    lastRanks.set(key, new Map(items.map((entry) => [entry.userId, entry.rank])))
    return ranked
}

export function useLeaderboard(scope: Scope, initial?: LeaderboardPage) {
    const version = useLeaderboardVersion()
    const key = scopeKey(scope)

    const [paging, setPaging] = React.useState({ key, page: 0 })
    if (paging.key !== key) {
        setPaging({ key, page: 0 })
    }
    const page = paging.key === key ? paging.page : 0
    const setPage = React.useCallback(
        (next: number) => setPaging({ key, page: next }),
        [key]
    )

    const query = useQuery({
        queryKey: ["leaderboard", key, page, version],
        queryFn: async () => {
            const result = await getLeaderboardAction({
                ...scope,
                limit: PAGE_SIZE,
                offset: page * PAGE_SIZE,
            })
            return { ...result, items: withMovement(key, result.items) }
        },
        initialData:
            page === 0 && version === 0 && initial
                ? {
                      ...initial,
                      items: initial.items.map((entry) => ({
                          ...entry,
                          movement: 0,
                      })),
                  }
                : undefined,
        placeholderData: (previous) => previous,
    })

    const total = query.data?.total ?? 0

    return {
        items: query.data?.items ?? [],
        total,
        page,
        pageSize: PAGE_SIZE,
        pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        loading: query.isPending,
        fetching: query.isFetching,
        error: query.error,
        setPage,
    }
}
