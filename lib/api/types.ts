/** Wire types shared with the Rust API. All amounts are micro-USDCx. */

export type AppUser = {
    id: string
    username: string | null
    displayName: string | null
    email: string
    emailVerifiedAt: string | null
    walletAddress: string | null
    walletVerifiedAt: string | null
    avatarUrl: string | null
    createdAt: string
    updatedAt: string
}

/** Public profile fields, safe to render for anyone. */
export type UserCard = {
    id: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
}

export type CustodialWallet = {
    userId: string
    stxAddress: string
    publicKey: string
    network: string
}

export type UpsertUserPayload = {
    id: string
    email: string
    displayName?: string | null
    avatarUrl?: string | null
    emailVerifiedAt?: string | null
}

export type UpdateProfilePayload = {
    username?: string | null
    displayName?: string | null
    avatarUrl?: string | null
}

export type CreateCustodialWalletPayload = {
    stxAddress: string
    publicKey: string
    encryptedMnemonic: string
    kmsKeyVersion: string
    network: string
}

export type GameMetadata = {
    id: string
    name: string
    description: string
    minPlayers: number
    maxPlayers: number
    categories: string[]
    fee: { percentage: number }
    devId: string
}

/** Live counters per game, for the directory and landing page. */
export type GameActivity = {
    gameId: string
    waitingLobbies: number
    liveLobbies: number
    activePlayers: number
    openPotMicro: number
}

export type LobbyStatus = "waiting" | "starting" | "inProgress" | "finished"

export type Lobby = {
    id: string
    path: string
    name: string
    description: string | null
    gameId: string
    creatorId: string
    entryAmountMicro: number
    potMicro: number
    isPrivate: boolean
    isSponsored: boolean
    status: LobbyStatus
    createdAt: string
    updatedAt: string
    participants: string[]
}

export type LobbyState = {
    lobbyId: string
    status: LobbyStatus
    participantCount: number
    startedAt: number | null
    finishedAt: number | null
    creatorLastPing: number | null
}

export type PlayerState = {
    userId: string
    username: string | null
    displayName: string | null
    status: string
    state: string
    rank: number | null
    prizeMicro: number | null
    warsPoint: number | null
    lastPing?: number | null
    isCreator: boolean
    ready: boolean
    joinedAt: number
    updatedAt: number
}

export type JoinRequestState = "pending" | "accepted" | "rejected"

export type JoinRequest = {
    userId: string
    username: string | null
    displayName: string | null
    state: JoinRequestState
    createdAt: number
}

export type LobbyDetail = {
    lobby: Lobby
    state: LobbyState | null
    players: PlayerState[]
}

export type LobbyChatMessage = {
    id: string
    lobbyId: string
    userId: string
    username: string | null
    displayName: string | null
    body: string
    sentAt: number
}

export type CreateLobbyPayload = {
    name: string
    description?: string | null
    gameId: string
    isPrivate?: boolean
    isSponsored?: boolean
    entryAmountMicro?: number
    path?: string | null
    vaultTxid?: string | null
}

/** Filters accepted by `GET /lobbies`. */
export type LobbyQuery = {
    gameId?: string
    status?: LobbyStatus[]
    creatorId?: string
    entry?: "paid" | "free"
    minPlayers?: number
    maxPlayers?: number
    includePrivate?: boolean
    limit?: number
    offset?: number
}

/** Single on-chain claim the winner must submit after a paid match. */
export type VaultClaimIntent = {
    userId: string
    principal?: string
    amountMicro: number
    nonce: number
    devWallet: string
    devFee: number
    role?: string
}

export type WalletBalance = {
    userId: string
    stxAddress: string
    availableMicro: number
    updatedAt: string
    cached?: boolean
}

export type ChainActivityKind =
    | "deposit"
    | "withdraw"
    | "vaultJoin"
    | "vaultLeave"
    | "vaultKick"
    | "vaultClaim"
    | "vaultDevFee"
    | "other"

export type ChainActivityItem = {
    txid: string
    kind: ChainActivityKind
    amountMicro: number
    fromAddress: string | null
    toAddress: string | null
    lobbyPath: string | null
    status: string
    blockTime: number | null
}

export type Season = {
    id: number
    name: string
    description: string | null
    startsAt: string
    endsAt: string
    createdAt: string
}

export type LeaderboardEntry = {
    rank: number
    userId: string
    points: number
    totalMatches: number
    totalWins: number
    totalPnl: number
    winRateBps: number
    username: string | null
    displayName: string | null
    avatarUrl: string | null
}

export type LeaderboardPage = {
    items: LeaderboardEntry[]
    total: number
    limit: number
    offset: number
}

export type LeaderboardQuery = {
    seasonId?: number
    gameId?: string
    limit?: number
    offset?: number
}

/* ------------------------------------------------------------------ */
/* Profile                                                             */
/* ------------------------------------------------------------------ */

export type MatchHistoryItem = {
    matchId: string
    lobbyId: string
    lobbyPath: string
    gameId: string
    potMicro: number
    entryAmountMicro: number
    playerCount: number
    finishedAt: string
    rank: number | null
    isWinner: boolean
    prizeMicro: number
    warsPoint: number
}

export type RecentMatch = {
    matchId: string
    lobbyPath: string
    gameId: string
    potMicro: number
    playerCount: number
    finishedAt: string
    winnerId: string | null
    winnerUsername: string | null
    winnerDisplayName: string | null
    winnerAvatarUrl: string | null
    winnerPrizeMicro: number
}

export type LifetimeTotals = {
    totalMatches: number
    totalWins: number
    totalWinningsMicro: number
    totalPnlMicro: number
    totalPoints: number
}

export type UserStatLine = {
    seasonId: number
    seasonName: string
    gameId: string
    points: number
    totalMatches: number
    totalWins: number
    totalPnl: number
}

export type FavouriteGame = {
    gameId: string
    matches: number
    wins: number
}

export type UserProfile = {
    user: AppUser
    lifetime: LifetimeTotals
    recentMatches: MatchHistoryItem[]
    favouriteGames: FavouriteGame[]
    statLines: UserStatLine[]
    currentSeasonId: number | null
    currentSeasonRank: number | null
}
