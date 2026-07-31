"use server"

import {
    getLeaderboard,
    listGameActivity,
    listGames,
    listLobbies,
    listRecentMatches,
    listSeasons,
    listUserCards,
} from "@/lib/api/server"
import type {
    GameActivity,
    GameMetadata,
    LeaderboardPage,
    LeaderboardQuery,
    Lobby,
    LobbyQuery,
    RecentMatch,
    Season,
    UserCard,
} from "@/lib/api/types"

/** Public reads exposed to client components that hydrate before WS deltas. */

export async function listGamesAction(): Promise<GameMetadata[]> {
    return listGames()
}

export async function listGameActivityAction(): Promise<GameActivity[]> {
    return listGameActivity()
}

export async function listLobbiesAction(query: LobbyQuery = {}): Promise<Lobby[]> {
    return listLobbies(query)
}

export async function listRecentMatchesAction(options: {
    gameId?: string
    limit?: number
} = {}): Promise<RecentMatch[]> {
    return listRecentMatches(options)
}

export async function listUserCardsAction(ids: string[]): Promise<UserCard[]> {
    return listUserCards(ids)
}

export async function getLeaderboardAction(
    query: LeaderboardQuery = {}
): Promise<LeaderboardPage> {
    return getLeaderboard(query)
}

export async function listSeasonsAction(): Promise<Season[]> {
    return listSeasons()
}
