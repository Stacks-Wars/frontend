/** Wire types shared with the Rust API. All amounts are micro-USDCx. */

export type AppUser = {
    id: string
    username: string | null
    displayName: string | null
    email: string
    emailVerifiedAt: string | null
    avatarUrl: string | null
    lobbyAlertsEnabled?: boolean
    currentChain?: import("@/lib/chain").ChainId
    legalAcceptedAt?: string | null
    legalVersion?: string | null
    referralPromptStatus?: "pending" | "set" | "skipped"
    questIntroSeenAt?: string | null
    gettingStartedCompletedAt?: string | null
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
    address: string
    publicKey: string
    network: string
    chain: import("@/lib/chain").ChainId
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
    address: string
    publicKey: string
    encryptedSigningMaterial: string
    kmsKeyVersion: string
    network: string
    chain: import("@/lib/chain").ChainId
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
    devId?: string | null
    devNeedsWallet?: boolean
}

export type VaultDraft = VaultDraftPayload & {
    userId: string
    createdAt: number
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

/** Unfinished hosted lobby the create-cap 409 / gate fetch returns. */
export type HostedLobbyRef = {
    path: string
    name: string
    status: LobbyStatus
}

export type Lobby = {
    id: string
    path: string
    name: string
    description: string | null
    gameId: string
    creatorId: string
    chain?: import("@/lib/chain").ChainId
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
    chain?: import("@/lib/chain").ChainId
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
    chain?: import("@/lib/chain").ChainId
}

/** Single on-chain claim the winner must submit after a paid match. */
export type VaultClaimIntent = {
    userId: string
    principal?: string
    amountMicro: number
    nonce: number
    devWallet: string
    devFee: number
    devId?: string | null
    devNeedsWallet?: boolean
    role?: string
}

export type WalletBalance = {
    userId: string
    address: string
    chain?: import("@/lib/chain").ChainId
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
    board?: LeaderboardBoard
    limit?: number
    offset?: number
}

export type LeaderboardBoard = "game" | "quests" | "all"

/* ------------------------------------------------------------------ */
/* Quests                                                              */
/* ------------------------------------------------------------------ */

export type QuestCategory =
    | "gettingStarted"
    | "daily"
    | "weekly"
    | "monthly"
    | "seasonal"
    | "paidLadder"

export type QuestState = "locked" | "active" | "claimable" | "claimed"

export type QuestCta = {
    href: string
    label: string
}

export type QuestView = {
    id: string
    title: string
    description: string
    category: QuestCategory
    progress: number
    target: number
    state: QuestState
    rewardPoints: number
    cta: QuestCta
    periodId: string
    resetsAt: string | null
}

export type QuestPeriodView = {
    kind: QuestCategory
    id: string
    startsAt: string
    resetsAt: string | null
    resetsLabel: string
}

export type BonusMissionView = QuestView & {
    stageIndex: number
    stageCount: number
    dollars: number
}

export type QuestMe = {
    catalogVersion: number
    now: string
    periods: QuestPeriodView[]
    streak: {
        current: number
        longest: number
        lastActiveDate: string | null
    }
    gettingStartedCompleted: boolean
    gettingStartedCompletedAt: string | null
    referralPromptStatus: "pending" | "set" | "skipped"
    questIntroSeenAt: string | null
    successfulReferrals: number
    seasonQuestPoints: number
    quests: QuestView[]
    bonusMission: BonusMissionView | null
}

export type QuestClaimResult = {
    id: string
    questId: string
    periodId: string
    rewardPoints: number
    claimedAt: string
    alreadyClaimed: boolean
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

/* ------------------------------------------------------------------ */
/* Platform analytics (admin)                                          */
/* ------------------------------------------------------------------ */

export type AnalyticsGrain = "day" | "week" | "month"
export type AnalyticsScope = "overall" | "season" | "custom"

export type AnalyticsQuery = {
    seasonId?: number
    from?: string
    to?: string
    gameId?: string
    chain?: string
}

export type AnalyticsRange = {
    from: string
    to: string
    grain: AnalyticsGrain
    scope: AnalyticsScope
    seasonId: number | null
    gameId: string | null
    chain: string | null
    activityScoped: boolean
}

export type AnalyticsKpis = {
    totalUsers: number
    newUsers: number
    gettingStartedCompleted: number
    gettingStartedCompletionRate: number | null
    activeUsers: number
    returningUsers: number
    gamesPlayed: number
    totalLobbies: number
    paidLobbiesCreated: number
    paidLobbiesCompleted: number
    totalVolumeMicro: number
    platformFeesMicro: number
}

export type OnboardingFunnel = {
    signups: number
    started: number
    completed: number
    startRate: number | null
    completeRate: number | null
    completeOfStartedRate: number | null
}

export type RetentionSnapshot = {
    activeUsers: number
    reactivatedUsers: number
    repeatUsers: number
    usersWithPlay: number
    repeatRate: number | null
}

export type QuestAnalytics = {
    claims: number
    uniqueClaimers: number
    pointsAwarded: number
    gettingStartedClaims: number
    dailyClaims: number
    weeklyClaims: number
    monthlyClaims: number
    seasonalClaims: number
    paidLadderClaims: number
}

export type AnalyticsPoint = {
    bucket: string
    newUsers: number
    activeUsers: number
    returningUsers: number
    gamesPlayed: number
    paidLobbiesCreated: number
    paidLobbiesCompleted: number
    volumeMicro: number
    platformFeesMicro: number
}

export type FeeBreakdown = {
    key: string
    paidMatches: number
    volumeMicro: number
    platformFeesMicro: number
}

export type SeasonComparisonRow = {
    seasonId: number
    name: string
    startsAt: string
    endsAt: string
    newUsers: number
    activeUsers: number
    gamesPlayed: number
    paidLobbiesCompleted: number
    volumeMicro: number
    platformFeesMicro: number
}

export type AnalyticsDefinitions = {
    qualifyingMatch: string
    platformFee: string
    volume: string
    activeUsers: string
    returningUsers: string
    gettingStarted: string
}

export type AnalyticsReport = {
    range: AnalyticsRange
    kpis: AnalyticsKpis
    funnel: OnboardingFunnel
    retention: RetentionSnapshot
    quests: QuestAnalytics
    series: AnalyticsPoint[]
    feesByChain: FeeBreakdown[]
    feesByGame: FeeBreakdown[]
    seasonComparison: SeasonComparisonRow[]
    definitions: AnalyticsDefinitions
}
