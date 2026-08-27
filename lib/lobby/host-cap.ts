import type { HostedLobbyRef, Lobby } from "@/lib/api/types"

/** Matches `MAX_ACTIVE_HOSTED_LOBBIES` in sw-server. */
export const MAX_ACTIVE_HOSTED_LOBBIES = 2

export const ACTIVE_HOST_STATUSES = [
    "waiting",
    "starting",
    "inProgress",
] as const

export function toHostedLobbyRef(lobby: Lobby): HostedLobbyRef {
    return {
        path: lobby.path,
        name: lobby.name,
        status: lobby.status,
    }
}

export function isAtHostCap(count: number): boolean {
    return count >= MAX_ACTIVE_HOSTED_LOBBIES
}
