import type {
    AppUser,
    CreateCustodialWalletPayload,
    CustodialWallet,
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

function mapUser(data: {
    id: string
    username: string | null
    display_name: string | null
    email: string
    email_verified_at: string | null
    wallet_address: string | null
    wallet_verified_at: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string
}): AppUser {
    return {
        id: data.id,
        username: data.username,
        displayName: data.display_name,
        email: data.email,
        emailVerifiedAt: data.email_verified_at,
        walletAddress: data.wallet_address,
        walletVerifiedAt: data.wallet_verified_at,
        avatarUrl: data.avatar_url,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
    }
}

export async function upsertAppUser(
    payload: UpsertUserPayload
): Promise<AppUser> {
    const response = await fetch(`${getApiBaseUrl()}/users`, {
        method: "POST",
        headers: internalHeaders(),
        body: JSON.stringify({
            email: payload.email,
            display_name: payload.displayName ?? null,
            avatar_url: payload.avatarUrl ?? null,
            email_verified_at: payload.emailVerifiedAt ?? null,
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

    return mapUser(await response.json())
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
            body?.error ?? `Failed to load custodial wallet (${response.status})`
        )
    }

    const data = (await response.json()) as {
        user_id: string
        stx_address: string
        public_key: string
        network: string
    }

    return {
        userId: data.user_id,
        stxAddress: data.stx_address,
        publicKey: data.public_key,
        network: data.network,
    }
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
                stx_address: payload.stxAddress,
                public_key: payload.publicKey,
                encrypted_mnemonic: payload.encryptedMnemonic,
                kms_key_version: payload.kmsKeyVersion,
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
        user_id: string
        stx_address: string
        public_key: string
        network: string
    }

    return {
        userId: data.user_id,
        stxAddress: data.stx_address,
        publicKey: data.public_key,
        network: data.network,
    }
}
