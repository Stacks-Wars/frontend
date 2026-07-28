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

export type CustodialWallet = {
    userId: string
    stxAddress: string
    publicKey: string
    network: string
}

export type UpsertUserPayload = {
    email: string
    displayName?: string | null
    avatarUrl?: string | null
    emailVerifiedAt?: string | null
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

export type Lobby = {
    id: string
    path: string
    name: string
    description: string | null
    gameId: string
    creatorId: string
    entryAmount: number | null
    currentAmount: number | null
    contractAddress: string | null
    isPrivate: boolean
    isSponsored: boolean
    status: string
    createdAt: string
    updatedAt: string
    participants: string[]
}

export type PlayerState = {
    userId: string
    username: string | null
    displayName: string | null
    status: string
    state: string
    rank: number | null
    prize: number | null
    warsPoint: number | null
    isCreator: boolean
    joinedAt: number
    updatedAt: number
}

export type LobbyDetail = {
    lobby: Lobby
    state: { status: string; participantCount: number } | null
    players: PlayerState[]
}

export type CreateLobbyPayload = {
    name: string
    description?: string | null
    gameId: string
    creatorId: string
    isPrivate?: boolean
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
