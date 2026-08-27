"use server"

import {
    getLeaderboard,
    listGameActivity,
    listGames,
    listUserCards,
} from "@/lib/api/server"
import type {
    GameActivity,
    GameMetadata,
    LeaderboardPage,
    LeaderboardQuery,
    UserCard,
} from "@/lib/api/types"

/** Public reads exposed to client components that hydrate before WS deltas. */

export async function listGamesAction(): Promise<GameMetadata[]> {
    return listGames()
}

export async function listGameActivityAction(): Promise<GameActivity[]> {
    return listGameActivity()
}

export async function listUserCardsAction(ids: string[]): Promise<UserCard[]> {
    return listUserCards(ids)
}

export async function getLeaderboardAction(
    query: LeaderboardQuery = {}
): Promise<LeaderboardPage> {
    return getLeaderboard(query)
}
