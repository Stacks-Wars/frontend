import type {
    AppUser,
    CreateCustodialWalletPayload,
    CreateLobbyPayload,
    CustodialWallet,
    GameMetadata,
    LeaderboardPage,
    LeaderboardQuery,
    LobbyDetail,
    Season,
    UpsertUserPayload,
} from "@/lib/api/types"

function getApiBaseUrl() {
    const url = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080"
    return url.replace(/\/$/, "")
}

function getInternalSecret() {
    const secret = process.env.INTERNAL_API_SECRET?.trim()
    if (!secret) {
        throw new Error("INTERNAL_API_SECRET must be set.")
    }
    return secret
}

function internalHeaders() {
    return {
        "content-type": "application/json",
        "x-internal-secret": getInternalSecret(),
    }
}

export async function listGames(): Promise<GameMetadata[]> {
    const response = await fetch(`${getApiBaseUrl()}/games`, {
        method: "GET",
        cache: "no-store",
    })
    if (!response.ok) {
        throw new Error(`Failed to load games (${response.status})`)
    }
    return response.json()
}

export async function getGame(gameId: string): Promise<GameMetadata | null> {
    const response = await fetch(`${getApiBaseUrl()}/games/${gameId}`, {
        method: "GET",
        cache: "no-store",
    })
    if (response.status === 404) return null
    if (!response.ok) {
        throw new Error(`Failed to load game (${response.status})`)
    }
    return response.json()
}

export async function createLobby(
    payload: CreateLobbyPayload
): Promise<LobbyDetail> {
    const response = await fetch(`${getApiBaseUrl()}/lobbies`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
            name: payload.name,
            description: payload.description ?? null,
            gameId: payload.gameId,
            creatorId: payload.creatorId,
            isPrivate: payload.isPrivate ?? false,
        }),
        cache: "no-store",
    })
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ?? `Failed to create lobby (${response.status})`
        )
    }
    return response.json()
}

export async function getLobbyByPath(
    path: string
): Promise<LobbyDetail | null> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/by-path/${path}`,
        {
            method: "GET",
            cache: "no-store",
        }
    )
    if (response.status === 404) return null
    if (!response.ok) {
        throw new Error(`Failed to load lobby (${response.status})`)
    }
    return response.json()
}

export async function upsertAppUser(
    payload: UpsertUserPayload
): Promise<AppUser> {
    const response = await fetch(`${getApiBaseUrl()}/users`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
            email: payload.email,
            displayName: payload.displayName ?? null,
            avatarUrl: payload.avatarUrl ?? null,
            emailVerifiedAt: payload.emailVerifiedAt ?? null,
        }),
        cache: "no-store",
    })

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ?? `Failed to sync user (${response.status})`
        )
    }

    return response.json()
}

export async function getCustodialWallet(
    userId: string
): Promise<CustodialWallet | null> {
    const response = await fetch(
        `${getApiBaseUrl()}/users/${userId}/custodial-wallet`,
        {
            method: "GET",
            headers: internalHeaders(),
            cache: "no-store",
        }
    )

    if (response.status === 404) {
        return null
    }

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ??
                `Failed to load custodial wallet (${response.status})`
        )
    }

    const data = (await response.json()) as {
        userId: string
        stxAddress: string
        publicKey: string
        network: string
    }

    return {
        userId: data.userId,
        stxAddress: data.stxAddress,
        publicKey: data.publicKey,
        network: data.network,
    }
}

export async function getCurrentSeason(): Promise<Season | null> {
    const response = await fetch(`${getApiBaseUrl()}/seasons/current`, {
        method: "GET",
        cache: "no-store",
    })
    if (response.status === 404) return null
    if (!response.ok) {
        throw new Error(`Failed to load current season (${response.status})`)
    }
    return response.json()
}

export async function getLeaderboard(
    query: LeaderboardQuery = {}
): Promise<LeaderboardPage> {
    const params = new URLSearchParams()
    if (query.seasonId != null) params.set("seasonId", String(query.seasonId))
    if (query.gameId) params.set("gameId", query.gameId)
    if (query.limit != null) params.set("limit", String(query.limit))
    if (query.offset != null) params.set("offset", String(query.offset))
    const qs = params.toString()
    const response = await fetch(
        `${getApiBaseUrl()}/leaderboard${qs ? `?${qs}` : ""}`,
        {
            method: "GET",
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to load leaderboard (${response.status})`)
    }
    return response.json()
}

export async function createCustodialWallet(
    userId: string,
    payload: CreateCustodialWalletPayload
): Promise<CustodialWallet> {
    const response = await fetch(
        `${getApiBaseUrl()}/users/${userId}/custodial-wallet`,
        {
            method: "POST",
            headers: internalHeaders(),
            body: JSON.stringify({
                stxAddress: payload.stxAddress,
                publicKey: payload.publicKey,
                encryptedMnemonic: payload.encryptedMnemonic,
                kmsKeyVersion: payload.kmsKeyVersion,
                network: payload.network,
            }),
            cache: "no-store",
        }
    )

    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ??
                `Failed to create custodial wallet (${response.status})`
        )
    }

    const data = (await response.json()) as {
        userId: string
        stxAddress: string
        publicKey: string
        network: string
    }

    return {
        userId: data.userId,
        stxAddress: data.stxAddress,
        publicKey: data.publicKey,
        network: data.network,
    }
}
