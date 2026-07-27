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
