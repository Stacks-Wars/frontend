import type {
    AppUser,
    ChainActivityItem,
    CreateCustodialWalletPayload,
    CreateLobbyPayload,
    CustodialWallet,
    GameActivity,
    GameMetadata,
    LeaderboardPage,
    LeaderboardQuery,
    Lobby,
    JoinRequest,
    LobbyDetail,
    LobbyQuery,
    MatchHistoryItem,
    RecentMatch,
    Season,
    UpdateProfilePayload,
    UpsertUserPayload,
    UserCard,
    UserProfile,
    WalletBalance,
} from "@/lib/api/types"
import { AccountDeleteError } from "@/lib/api/account-delete"

function getApiBaseUrl() {
    const url = process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080"
    return url.replace(/\/$/, "")
}

async function authHeaders(): Promise<HeadersInit> {
    const { getAccessToken } = await import("@/lib/auth/access-token")
    const token = await getAccessToken()
    return {
        "content-type": "application/json",
        Authorization: `Bearer ${token}`,
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
        headers: await authHeaders(),
        body: JSON.stringify({
            name: payload.name,
            description: payload.description ?? null,
            gameId: payload.gameId,
            isPrivate: payload.isPrivate ?? false,
            isSponsored: payload.isSponsored ?? false,
            entryAmountMicro: payload.entryAmountMicro ?? 0,
            path: payload.path ?? null,
            vaultTxid: payload.vaultTxid ?? null,
        }),
        cache: "no-store",
    })
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
            code?: string
            requiredMicro?: number
            availableMicro?: number
        } | null
        if (body?.code === "insufficient_balance") {
            throw new Error(
                `Insufficient balance. Need ${((body.requiredMicro ?? 0) / 1_000_000).toFixed(2)} — fund your account.`
            )
        }
        throw new Error(
            body?.error ?? `Failed to create lobby (${response.status})`
        )
    }
    return response.json()
}

export async function listLobbies(query: LobbyQuery = {}): Promise<Lobby[]> {
    const params = new URLSearchParams()
    if (query.gameId) params.set("gameId", query.gameId)
    if (query.status?.length) params.set("status", query.status.join(","))
    if (query.creatorId) params.set("creatorId", query.creatorId)
    if (query.entry) params.set("entry", query.entry)
    if (query.minPlayers != null)
        params.set("minPlayers", String(query.minPlayers))
    if (query.maxPlayers != null)
        params.set("maxPlayers", String(query.maxPlayers))
    if (query.includePrivate) params.set("includePrivate", "true")
    if (query.limit != null) params.set("limit", String(query.limit))
    if (query.offset != null) params.set("offset", String(query.offset))

    const qs = params.toString()
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies${qs ? `?${qs}` : ""}`,
        { method: "GET", cache: "no-store" }
    )
    if (!response.ok) {
        throw new Error(`Failed to load lobbies (${response.status})`)
    }
    return response.json()
}

export async function listGameActivity(): Promise<GameActivity[]> {
    const response = await fetch(`${getApiBaseUrl()}/games/activity`, {
        method: "GET",
        cache: "no-store",
    })
    if (!response.ok) {
        throw new Error(`Failed to load game activity (${response.status})`)
    }
    return response.json()
}

export async function listRecentMatches(options: {
    gameId?: string
    limit?: number
} = {}): Promise<RecentMatch[]> {
    const params = new URLSearchParams()
    if (options.gameId) params.set("gameId", options.gameId)
    if (options.limit != null) params.set("limit", String(options.limit))
    const qs = params.toString()
    const response = await fetch(
        `${getApiBaseUrl()}/games/recent-matches${qs ? `?${qs}` : ""}`,
        { method: "GET", cache: "no-store" }
    )
    if (!response.ok) {
        throw new Error(`Failed to load recent matches (${response.status})`)
    }
    return response.json()
}

export class LobbyApiError extends Error {
    code: string
    constructor(message: string, code: string) {
        super(message)
        this.code = code
    }
}

export async function reserveLobbySeat(lobbyId: string): Promise<void> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${lobbyId}/reserve-seat`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: "{}",
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
            code?: string
        } | null
        throw new LobbyApiError(
            body?.error ?? `Failed to reserve seat (${response.status})`,
            body?.code ?? "conflict"
        )
    }
}

export async function releaseLobbySeat(lobbyId: string): Promise<void> {
    await fetch(`${getApiBaseUrl()}/lobbies/${lobbyId}/reserve-seat`, {
        method: "DELETE",
        headers: await authHeaders(),
        cache: "no-store",
    }).catch(() => undefined)
}

export async function joinLobby(
    lobbyId: string,
    vaultTxid?: string | null
): Promise<LobbyDetail> {
    const response = await fetch(`${getApiBaseUrl()}/lobbies/${lobbyId}/join`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
            vaultTxid: vaultTxid ?? null,
        }),
        cache: "no-store",
    })
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
            code?: string
        } | null
        if (body?.code === "insufficient_balance") {
            throw new LobbyApiError(
                "Insufficient balance — fund your Stacks Wars account.",
                "insufficient_balance"
            )
        }
        throw new LobbyApiError(
            body?.error ?? `Failed to join (${response.status})`,
            body?.code ?? "conflict"
        )
    }
    return response.json()
}

export async function createJoinRequest(lobbyId: string): Promise<JoinRequest> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${lobbyId}/join-requests`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({}),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ?? `Failed to request join (${response.status})`
        )
    }
    return response.json()
}

export async function approveJoinRequest(
    lobbyId: string,
    userId: string
): Promise<JoinRequest> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${lobbyId}/join-requests/${userId}/approve`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({}),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ?? `Failed to approve request (${response.status})`
        )
    }
    return response.json()
}

export async function rejectJoinRequest(
    lobbyId: string,
    userId: string
): Promise<JoinRequest> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${lobbyId}/join-requests/${userId}/reject`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({}),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ?? `Failed to reject request (${response.status})`
        )
    }
    return response.json()
}

export async function leaveLobby(
    lobbyId: string,
    vaultTxid?: string | null
): Promise<LobbyDetail> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${lobbyId}/leave`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({
                vaultTxid: vaultTxid ?? null,
            }),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(body?.error ?? `Failed to leave (${response.status})`)
    }
    return response.json()
}

export async function setLobbyReady(
    lobbyId: string,
    ready = true
): Promise<LobbyDetail> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${lobbyId}/ready`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({ ready }),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(body?.error ?? `Failed to ready (${response.status})`)
    }
    return response.json()
}

export async function startLobby(lobbyId: string): Promise<LobbyDetail> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${lobbyId}/start`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({}),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(body?.error ?? `Failed to start (${response.status})`)
    }
    return response.json()
}

export async function getBalance(userId: string): Promise<WalletBalance> {
    const response = await fetch(
        `${getApiBaseUrl()}/wallet/balance/${userId}`,
        {
            method: "GET",
            headers: await authHeaders(),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to load balance (${response.status})`)
    }
    return response.json()
}

export async function refreshBalance(
    userId: string
): Promise<WalletBalance> {
    const response = await fetch(
        `${getApiBaseUrl()}/wallet/balance/${userId}/refresh`,
        {
            method: "POST",
            headers: await authHeaders(),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to refresh balance (${response.status})`)
    }
    return response.json()
}

export async function listWalletActivity(
    userId: string
): Promise<ChainActivityItem[]> {
    const response = await fetch(
        `${getApiBaseUrl()}/wallet/activity/${userId}`,
        {
            method: "GET",
            headers: await authHeaders(),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to load activity (${response.status})`)
    }
    return response.json()
}

export type WithdrawPrepare = {
    userId: string
    amountMicro: number
    fromAddress: string
    toAddress: string
    usdcxContract: string
    usdcxAssetName: string
}

export async function prepareWithdrawal(payload: {
    amountMicro: number
    toAddress?: string
}): Promise<WithdrawPrepare> {
    const response = await fetch(
        `${getApiBaseUrl()}/wallet/withdrawals/prepare`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({
                amountMicro: payload.amountMicro,
                toAddress: payload.toAddress ?? null,
            }),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ?? `Failed to prepare withdraw (${response.status})`
        )
    }
    return response.json()
}

export async function completeWithdrawal(payload: {
    txid: string
}): Promise<WalletBalance> {
    const response = await fetch(
        `${getApiBaseUrl()}/wallet/withdrawals/complete`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({
                txid: payload.txid,
            }),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ?? `Failed to complete withdraw (${response.status})`
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

export async function getLobby(lobbyId: string): Promise<LobbyDetail | null> {
    const response = await fetch(`${getApiBaseUrl()}/lobbies/${lobbyId}`, {
        method: "GET",
        cache: "no-store",
    })
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
        headers: await authHeaders(),
        body: JSON.stringify({
            id: payload.id,
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
            headers: await authHeaders(),
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

export async function getUserByUsername(
    username: string
): Promise<AppUser | null> {
    const response = await fetch(
        `${getApiBaseUrl()}/users/by-username/${encodeURIComponent(username)}`,
        { method: "GET", cache: "no-store" }
    )
    if (response.status === 404) return null
    if (!response.ok) {
        throw new Error(`Failed to load user (${response.status})`)
    }
    return response.json()
}

/** Batch public lookup, for lists that show host and player names. */
export async function listUserCards(ids: string[]): Promise<UserCard[]> {
    const unique = Array.from(new Set(ids.filter(Boolean))).slice(0, 100)
    if (unique.length === 0) return []

    const response = await fetch(
        `${getApiBaseUrl()}/users/cards?ids=${encodeURIComponent(unique.join(","))}`,
        { method: "GET", cache: "no-store" }
    )
    if (!response.ok) {
        throw new Error(`Failed to load users (${response.status})`)
    }
    return response.json()
}

export async function getUserProfile(
    userId: string
): Promise<UserProfile | null> {
    const response = await fetch(
        `${getApiBaseUrl()}/users/${userId}/profile`,
        { method: "GET", cache: "no-store" }
    )
    if (response.status === 404) return null
    if (!response.ok) {
        throw new Error(`Failed to load profile (${response.status})`)
    }
    return response.json()
}

export async function listUserMatches(
    userId: string,
    options: { limit?: number; offset?: number } = {}
): Promise<MatchHistoryItem[]> {
    const params = new URLSearchParams()
    if (options.limit != null) params.set("limit", String(options.limit))
    if (options.offset != null) params.set("offset", String(options.offset))
    const qs = params.toString()
    const response = await fetch(
        `${getApiBaseUrl()}/users/${userId}/matches${qs ? `?${qs}` : ""}`,
        { method: "GET", cache: "no-store" }
    )
    if (!response.ok) {
        throw new Error(`Failed to load match history (${response.status})`)
    }
    return response.json()
}

export async function checkUsernameAvailable(
    username: string
): Promise<{ available: boolean; reason?: string; username?: string }> {
    const response = await fetch(
        `${getApiBaseUrl()}/users/username-available/${encodeURIComponent(username)}`,
        { method: "GET", cache: "no-store" }
    )
    if (!response.ok) {
        throw new Error(`Failed to check username (${response.status})`)
    }
    return response.json()
}

export async function updateAppUser(
    userId: string,
    payload: UpdateProfilePayload
): Promise<AppUser> {
    const response = await fetch(`${getApiBaseUrl()}/users/${userId}`, {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify({
            username: payload.username ?? null,
            displayName: payload.displayName ?? null,
            avatarUrl: payload.avatarUrl ?? null,
        }),
        cache: "no-store",
    })
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(
            body?.error ?? `Failed to update profile (${response.status})`
        )
    }
    return response.json()
}

/** Creator-only: the vault principal to refund when kicking a player. */
export async function getKickTargetAddress(
    lobbyId: string,
    targetUserId: string
): Promise<string> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${lobbyId}/players/${targetUserId}/vault-address`,
        { method: "GET", headers: await authHeaders(), cache: "no-store" }
    )
    if (!response.ok) {
        throw new Error(`Failed to resolve player address (${response.status})`)
    }
    const data = (await response.json()) as { stxAddress: string }
    return data.stxAddress
}

export async function kickLobbyPlayer(
    lobbyId: string,
    targetUserId: string,
    vaultTxid?: string | null
): Promise<LobbyDetail> {
    const response = await fetch(`${getApiBaseUrl()}/lobbies/${lobbyId}/kick`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({
            targetUserId,
            vaultTxid: vaultTxid ?? null,
        }),
        cache: "no-store",
    })
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(body?.error ?? `Failed to kick (${response.status})`)
    }
    return response.json()
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

export async function listSeasons(): Promise<Season[]> {
    const response = await fetch(`${getApiBaseUrl()}/seasons`, {
        method: "GET",
        cache: "no-store",
    })
    if (!response.ok) {
        throw new Error(`Failed to load seasons (${response.status})`)
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
            headers: await authHeaders(),
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

export type SigningMaterial = {
    userId: string
    stxAddress: string
    publicKey: string
    network: string
    encryptedMnemonic: string
    kmsKeyVersion: string
    usdcxContract: string
}

export async function getSigningMaterial(
    userId: string
): Promise<SigningMaterial> {
    const response = await fetch(
        `${getApiBaseUrl()}/wallet/custodial/${userId}/signing-material`,
        {
            method: "GET",
            headers: await authHeaders(),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to load signing material (${response.status})`)
    }
    const data = (await response.json()) as {
        userId: string
        stxAddress: string
        publicKey: string
        network: string
        encryptedMnemonic: string
        kmsKeyVersion: string
        usdcxContract: string
    }
    return data
}

export async function allocateLobbyPath(): Promise<string> {
    const response = await fetch(`${getApiBaseUrl()}/lobbies/allocate-path`, {
        method: "POST",
        headers: await authHeaders(),
        cache: "no-store",
    })
    if (!response.ok) {
        throw new Error(`Failed to allocate lobby path (${response.status})`)
    }
    const data = (await response.json()) as { path: string }
    return data.path
}

export async function confirmVaultClaim(payload: {
    lobbyId: string
    amountMicro: number
    nonce: number
    vaultTxid: string
}): Promise<void> {
    const response = await fetch(
        `${getApiBaseUrl()}/lobbies/${payload.lobbyId}/vault-claim`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify({
                amountMicro: payload.amountMicro,
                nonce: payload.nonce,
                vaultTxid: payload.vaultTxid,
            }),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            error?: string
        } | null
        throw new Error(body?.error ?? `Failed to confirm claim (${response.status})`)
    }
}

export type VaultDraftPayload = {
    kind: string
    lobbyPath: string
    lobbyId?: string
    /** Empty string for pending claim intents before broadcast. */
    txid: string
    entryAmountMicro: number
    transferMicro?: number
    sponsored?: boolean
    name?: string
    description?: string | null
    gameId?: string
    isPrivate?: boolean
    isSponsored?: boolean
    amountMicro?: number
    nonce?: number
    paidMicro?: number
    devWallet?: string
    devFee?: number
}

export type VaultDraft = VaultDraftPayload & {
    userId: string
    createdAt: number
}

export async function saveVaultDraft(
    payload: VaultDraftPayload
): Promise<VaultDraft> {
    const response = await fetch(`${getApiBaseUrl()}/users/me/vault-drafts`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
    })
    if (!response.ok) {
        throw new Error(`Failed to save vault draft (${response.status})`)
    }
    return response.json()
}

export async function listVaultDrafts(kind?: string): Promise<VaultDraft[]> {
    const query = kind ? `?kind=${encodeURIComponent(kind)}` : ""
    const response = await fetch(
        `${getApiBaseUrl()}/users/me/vault-drafts${query}`,
        {
            method: "GET",
            headers: await authHeaders(),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to list vault drafts (${response.status})`)
    }
    return response.json()
}

export async function clearVaultDraft(
    kind: string,
    lobbyPath: string
): Promise<void> {
    const response = await fetch(
        `${getApiBaseUrl()}/users/me/vault-drafts/${encodeURIComponent(kind)}/${encodeURIComponent(lobbyPath)}`,
        {
            method: "DELETE",
            headers: await authHeaders(),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to clear vault draft (${response.status})`)
    }
}

export async function acceptLegal(version: string): Promise<AppUser> {
    const response = await fetch(`${getApiBaseUrl()}/users/me/legal-accept`, {
        method: "POST",
        headers: await authHeaders(),
        body: JSON.stringify({ version }),
        cache: "no-store",
    })
    if (!response.ok) {
        throw new Error(`Failed to record legal acceptance (${response.status})`)
    }
    return response.json()
}

export async function updatePreferences(payload: {
    lobbyAlertsEnabled?: boolean
}): Promise<AppUser> {
    const response = await fetch(`${getApiBaseUrl()}/users/me/preferences`, {
        method: "PATCH",
        headers: await authHeaders(),
        body: JSON.stringify(payload),
        cache: "no-store",
    })
    if (!response.ok) {
        throw new Error(`Failed to update preferences (${response.status})`)
    }
    return response.json()
}

export async function savePushSubscription(payload: {
    endpoint: string
    keys: { p256dh: string; auth: string }
    userAgent?: string
}): Promise<void> {
    const response = await fetch(
        `${getApiBaseUrl()}/users/me/push-subscription`,
        {
            method: "POST",
            headers: await authHeaders(),
            body: JSON.stringify(payload),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(`Failed to save push subscription (${response.status})`)
    }
}

export async function deletePushSubscription(endpoint: string): Promise<void> {
    const response = await fetch(
        `${getApiBaseUrl()}/users/me/push-subscription`,
        {
            method: "DELETE",
            headers: await authHeaders(),
            body: JSON.stringify({ endpoint }),
            cache: "no-store",
        }
    )
    if (!response.ok) {
        throw new Error(
            `Failed to delete push subscription (${response.status})`
        )
    }
}

export async function deleteAppAccount(): Promise<void> {
    const response = await fetch(`${getApiBaseUrl()}/users/me`, {
        method: "DELETE",
        headers: await authHeaders(),
        cache: "no-store",
    })
    if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
            code?: string
            error?: string
            availableMicro?: number
            pendingClaimMicro?: number
        } | null
        if (response.status === 409 && body) {
            throw new AccountDeleteError(body)
        }
        throw new Error(
            body?.error ?? `Failed to delete account (${response.status})`
        )
    }
}
