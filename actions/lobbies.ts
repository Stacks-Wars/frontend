"use server"

import { syncAuthUser } from "@/actions/users"
import { type ActionResult, TooManyLobbiesError, actionResult } from "@/lib/action-result"
import {
    allocateLobbyPath,
    approveJoinRequest as approveJoinRequestApi,
    clearVaultDraft,
    confirmVaultClaim,
    createJoinRequest as createJoinRequestApi,
    createLobby as createLobbyApi,
    getKickTargetAddress,
    getLobby,
    joinLobby as joinLobbyApi,
    kickLobbyPlayer as kickLobbyPlayerApi,
    leaveLobby as leaveLobbyApi,
    listLobbies,
    listVaultDrafts,
    LobbyApiError,
    rejectJoinRequest as rejectJoinRequestApi,
    releaseLobbySeat,
    reserveLobbySeat,
    saveVaultDraft,
    setLobbyReady as setLobbyReadyApi,
    startLobby as startLobbyApi,
} from "@/lib/api/server"
import type { JoinRequest, LobbyDetail } from "@/lib/api/types"
import { auth } from "@/lib/auth/server"
import { currentChainFromCookie } from "@/lib/chain/server"
import {
    ACTIVE_HOST_STATUSES,
    isAtHostCap,
    toHostedLobbyRef,
} from "@/lib/lobby/host-cap"
import { MIN_ENTRY_MICRO, needsOnChainVault, vaultConfigured } from "@/lib/vault/config"
import {
    resumeVaultTxOrDiscard,
    vaultClaimOnChain,
    vaultJoinOnChain,
    vaultKickOnChain,
    vaultLeaveOnChain,
    waitForVaultTx,
} from "@/lib/vault/submit"

type SessionUser = {
    id: string
    email: string
    name?: string | null
    image?: string | null
    emailVerified?: boolean | string | Date | null
}

/** Resolves the signed-in app user, creating/refreshing the backend row. */
async function requireUser() {
    const { data: session } = await auth.getSession()
    if (!session?.user?.email) {
        throw new Error("Sign in to continue.")
    }
    return syncAuthUser(session.user as SessionUser)
}

async function requireLobby(lobbyId: string) {
    const detail = await getLobby(lobbyId)
    if (!detail) {
        throw new Error("This lobby no longer exists.")
    }
    return detail
}

export async function createLobbyAction(input: {
    name: string
    description?: string
    gameId: string
    isPrivate?: boolean
    isSponsored?: boolean
    entryAmountMicro?: number
    /** Force resume of the newest incomplete paid create draft (ignores form match). */
    resumeIncomplete?: boolean
}): Promise<ActionResult<LobbyDetail>> {
    return actionResult(async () => {
        const user = await requireUser()
        const chain = await currentChainFromCookie()

        const createDrafts = await listVaultDrafts("create").catch(() => [])
        const joinDrafts = await listVaultDrafts("join").catch(() => [])
        const incomplete =
            createDrafts.find(
                (draft) =>
                    draft.entryAmountMicro > 0 &&
                    Boolean(draft.txid?.trim()) &&
                    Boolean(draft.lobbyPath) &&
                    !draft.lobbyId
            ) ??
            joinDrafts.find(
                (draft) =>
                    draft.entryAmountMicro > 0 &&
                    Boolean(draft.txid?.trim()) &&
                    Boolean(draft.lobbyPath) &&
                    !draft.lobbyId
            )

        // Always finish an incomplete paid create before broadcasting another join.
        // A refresh after broadcast must never charge the user twice.
        const shouldResume = Boolean(incomplete)
        if (input.resumeIncomplete && !incomplete) {
            throw new Error("No unfinished paid lobby to continue.")
        }

        if (!shouldResume) {
            const hosted = await listLobbies({
                creatorId: user.id,
                status: [...ACTIVE_HOST_STATUSES],
                limit: 8,
            }).catch(() => [])
            if (isAtHostCap(hosted.length)) {
                throw new TooManyLobbiesError(hosted.map(toHostedLobbyRef))
            }
        }

        const name = (shouldResume && incomplete?.name?.trim()) || input.name
        const description =
            (shouldResume && incomplete?.description !== undefined
                ? incomplete.description
                : input.description) ?? null
        const gameId =
            (shouldResume && incomplete?.gameId) || input.gameId
        const entryAmountMicro = shouldResume
            ? incomplete!.entryAmountMicro
            : (input.entryAmountMicro ?? 0)
        const isSponsored = shouldResume
            ? Boolean(incomplete!.isSponsored ?? incomplete!.sponsored)
            : (input.isSponsored ?? false) && entryAmountMicro > 0
        const isPrivate = shouldResume
            ? Boolean(incomplete!.isPrivate)
            : (input.isPrivate ?? false)

        if (!name || name.trim().length < 3) {
            throw new Error("Lobby name must be at least 3 characters.")
        }
        if (!gameId) {
            throw new Error("Pick a game for this lobby.")
        }
        if (entryAmountMicro < 0) {
            throw new Error("Entry amount must be zero or more.")
        }
        if (entryAmountMicro > 0 && entryAmountMicro < MIN_ENTRY_MICRO) {
            throw new Error("Paid lobbies need at least a $1 entry.")
        }

        let path: string | undefined
        let vaultTxid: string | undefined
        if (needsOnChainVault(entryAmountMicro)) {
            let resumed: string | null = null
            if (shouldResume && incomplete?.txid && incomplete.lobbyPath) {
                path = incomplete.lobbyPath
                resumed = await resumeVaultTxOrDiscard({
                    txid: incomplete.txid,
                    drafts: [
                        { kind: "create", lobbyPath: path },
                        { kind: "join", lobbyPath: path },
                    ],
                })
                if (resumed) {
                    vaultTxid = resumed
                    await saveVaultDraft({
                        kind: "create",
                        lobbyPath: path,
                        txid: vaultTxid,
                        entryAmountMicro,
                        transferMicro: entryAmountMicro,
                        sponsored: isSponsored,
                        name: name.trim(),
                        description,
                        gameId,
                        isPrivate,
                        isSponsored,
                    }).catch(() => undefined)
                }
            }

            if (!resumed) {
                // Fresh path, or previous draft aborted (e.g. u1) and was discarded.
                if (!path) {
                    path = await allocateLobbyPath()
                }
                vaultTxid = await vaultJoinOnChain({
                    userId: user.id,
                    lobbyPath: path,
                    entryAmountMicro,
                    transferMicro: entryAmountMicro,
                    sponsored: isSponsored,
                    wait: false,
                    chain,
                })
                await saveVaultDraft({
                    kind: "create",
                    lobbyPath: path,
                    txid: vaultTxid,
                    entryAmountMicro,
                    transferMicro: entryAmountMicro,
                    sponsored: isSponsored,
                    name: name.trim(),
                    description,
                    gameId,
                    isPrivate,
                    isSponsored,
                })
                vaultTxid = await waitForVaultTx(vaultTxid, {
                    discardDraftsOnFailure: [
                        { kind: "create", lobbyPath: path },
                        { kind: "join", lobbyPath: path },
                    ],
                    chain,
                })
            }
        } else if (entryAmountMicro > 0 && !vaultConfigured()) {
            throw new Error("Paid lobbies are unavailable right now.")
        }

        try {
            const detail = await createLobbyApi({
                name: name.trim(),
                description,
                gameId,
                isPrivate,
                isSponsored,
                entryAmountMicro,
                path: path ?? null,
                vaultTxid: vaultTxid ?? null,
                chain,
            })
            if (path) {
                await clearVaultDraft("create", path).catch(() => undefined)
                await clearVaultDraft("join", path).catch(() => undefined)
            }
            return detail
        } catch (error) {
            if (
                error instanceof LobbyApiError &&
                error.code === "too_many_lobbies"
            ) {
                throw new TooManyLobbiesError(error.lobbies ?? [])
            }
            throw error
        }
    })
}

export async function joinLobbyAction(
    lobbyId: string
): Promise<ActionResult<LobbyDetail>> {
    return actionResult(async () => {
        const user = await requireUser()
        const detail = await requireLobby(lobbyId)
        const path = detail.lobby.path
        const entry = detail.lobby.entryAmountMicro
        const paidMicro =
            entry > 0 && !detail.lobby.isSponsored ? entry : 0

        // Book capacity before broadcasting a paid join so two racers can't
        // both pay a max-2 lobby (checkers) and then hit "full" on the API.
        try {
            await reserveLobbySeat(lobbyId)
        } catch (error) {
            if (
                error instanceof LobbyApiError &&
                error.code === "lobby_full"
            ) {
                throw new Error("This lobby is full.")
            }
            throw error
        }

        let vaultTxid: string | undefined
        try {
            if (needsOnChainVault(entry)) {
                const drafts = await listVaultDrafts("join").catch(() => [])
                const resume = drafts.find((draft) => draft.lobbyPath === path)
                let resumed: string | null = null
                if (resume?.txid) {
                    resumed = await resumeVaultTxOrDiscard({
                        txid: resume.txid,
                        drafts: [{ kind: "join", lobbyPath: path }],
                    })
                }
                if (resumed) {
                    vaultTxid = resumed
                } else {
                    vaultTxid = await vaultJoinOnChain({
                        userId: user.id,
                        lobbyPath: path,
                        entryAmountMicro: entry,
                        transferMicro: paidMicro,
                        sponsored: detail.lobby.isSponsored,
                        chain: detail.lobby.chain,
                    })
                }
            }

            const joined = await joinLobbyApi(lobbyId, vaultTxid)
            if (path && vaultTxid) {
                await clearVaultDraft("join", path).catch(() => undefined)
            }
            return joined
        } catch (error) {
            const full =
                error instanceof LobbyApiError && error.code === "lobby_full"
            if (full && vaultTxid && needsOnChainVault(entry)) {
                // Paid on-chain but lost the seat race — refund via leave.
                try {
                    await vaultLeaveOnChain({
                        userId: user.id,
                        lobbyPath: path,
                        paidMicro,
                        nonce: Date.now(),
                        lobbyId,
                        chain: detail.lobby.chain,
                    })
                    await clearVaultDraft("join", path).catch(() => undefined)
                    await clearVaultDraft("leave", path).catch(() => undefined)
                } catch (refundError) {
                    console.error(
                        "[join] auto-refund after full lobby failed",
                        refundError
                    )
                    throw new Error(
                        "Lobby filled while joining. Your entry is on-chain — open the room and leave to refund, or retry shortly."
                    )
                }
                await releaseLobbySeat(lobbyId).catch(() => undefined)
                throw new Error(
                    "Lobby filled while joining. Your entry was refunded."
                )
            }
            await releaseLobbySeat(lobbyId).catch(() => undefined)
            throw error
        }
    })
}

export async function requestJoinLobbyAction(
    lobbyId: string
): Promise<ActionResult<JoinRequest>> {
    return actionResult(async () => {
        await requireUser()
        await requireLobby(lobbyId)
        return createJoinRequestApi(lobbyId)
    })
}

export async function approveJoinRequestAction(
    lobbyId: string,
    userId: string
): Promise<ActionResult<JoinRequest>> {
    return actionResult(async () => {
        const me = await requireUser()
        const detail = await requireLobby(lobbyId)
        if (detail.lobby.creatorId !== me.id) {
            throw new Error("Only the host can approve requests.")
        }
        return approveJoinRequestApi(lobbyId, userId)
    })
}

export async function rejectJoinRequestAction(
    lobbyId: string,
    userId: string
): Promise<ActionResult<JoinRequest>> {
    return actionResult(async () => {
        const me = await requireUser()
        const detail = await requireLobby(lobbyId)
        if (detail.lobby.creatorId !== me.id) {
            throw new Error("Only the host can reject requests.")
        }
        return rejectJoinRequestApi(lobbyId, userId)
    })
}

export async function leaveLobbyAction(
    lobbyId: string
): Promise<ActionResult<LobbyDetail>> {
    return actionResult(async () => {
        const user = await requireUser()
        const detail = await requireLobby(lobbyId)
        const path = detail.lobby.path

        const entry = detail.lobby.entryAmountMicro
        let vaultTxid: string | undefined
        if (needsOnChainVault(entry)) {
            const drafts = await listVaultDrafts("leave").catch(() => [])
            const resume = drafts.find((draft) => draft.lobbyPath === path)
            let resumed: string | null = null
            if (resume?.txid) {
                resumed = await resumeVaultTxOrDiscard({
                    txid: resume.txid,
                    drafts: [{ kind: "leave", lobbyPath: path }],
                })
            }
            if (resumed) {
                vaultTxid = resumed
            } else {
                const paid =
                    detail.lobby.isSponsored && detail.lobby.creatorId !== user.id
                        ? 0
                        : entry
                vaultTxid = await vaultLeaveOnChain({
                    userId: user.id,
                    lobbyPath: path,
                    paidMicro: paid,
                    nonce: Date.now(),
                    wait: false,
                    chain: detail.lobby.chain,
                })
                vaultTxid = await waitForVaultTx(vaultTxid, {
                    discardDraftsOnFailure: [
                        { kind: "leave", lobbyPath: path },
                    ],
                })
            }
        }

        const left = await leaveLobbyApi(lobbyId, vaultTxid)
        if (path && vaultTxid) {
            await clearVaultDraft("leave", path).catch(() => undefined)
        }
        return left
    })
}

export async function readyLobbyAction(
    lobbyId: string,
    ready = true
): Promise<ActionResult<LobbyDetail>> {
    return actionResult(async () => {
        await requireUser()
        return setLobbyReadyApi(lobbyId, ready)
    })
}

/** Creator-only. Refunds a paid seat on-chain before removing the player. */
export async function kickLobbyPlayerAction(
    lobbyId: string,
    targetUserId: string
): Promise<ActionResult<LobbyDetail>> {
    return actionResult(async () => {
        const me = await requireUser()
        const detail = await requireLobby(lobbyId)
        if (detail.lobby.creatorId !== me.id) {
            throw new Error("Only the host can remove players.")
        }

        const entry = detail.lobby.entryAmountMicro
        let vaultTxid: string | undefined
        if (needsOnChainVault(entry)) {
            vaultTxid = await vaultKickOnChain({
                actorUserId: me.id,
                targetAddress: await getKickTargetAddress(
                    lobbyId,
                    targetUserId
                ),
                lobbyPath: detail.lobby.path,
                paidMicro: detail.lobby.isSponsored ? 0 : entry,
                nonce: Date.now(),
                chain: detail.lobby.chain,
            })
        }

        return kickLobbyPlayerApi(lobbyId, targetUserId, vaultTxid)
    })
}

/** Creator-only. Marks the host ready first so one click is enough. */
export async function startLobbyAction(
    lobbyId: string
): Promise<ActionResult<LobbyDetail>> {
    return actionResult(async () => {
        const me = await requireUser()
        const detail = await requireLobby(lobbyId)

        const host = detail.players.find((player) => player.userId === me.id)
        if (host && !host.ready) {
            await setLobbyReadyApi(lobbyId, true)
        }
        return startLobbyApi(lobbyId)
    })
}

export type VaultClaimInput = {
    userId: string
    principal?: string
    amountMicro: number
    nonce: number
    devWallet: string
    devFee: number
    devId?: string | null
    devNeedsWallet?: boolean
}

/** Submit the winner's on-chain vault claim (contract splits platform + optional dev). */
export async function settleVaultClaimsAction(input: {
    lobbyId: string
    lobbyPath: string
    claims: VaultClaimInput[]
}): Promise<ActionResult<{ claimed: number }>> {
    return actionResult(async () => {
        if (!vaultConfigured() || input.claims.length === 0) {
            return { claimed: 0 }
        }
        const me = await requireUser()
        const detail = await requireLobby(input.lobbyId)

        let claimed = 0
        for (const claim of input.claims) {
            if (claim.amountMicro <= 0) continue
            if (claim.userId !== me.id) continue
            if (
                !claim.devWallet &&
                !(claim.devNeedsWallet && claim.devId)
            ) {
                throw new Error("Payout is not configured for this game.")
            }
            const drafts = await listVaultDrafts("claim").catch(() => [])
            const resume = drafts.find(
                (draft) =>
                    draft.lobbyPath === input.lobbyPath &&
                    Boolean(draft.txid?.trim())
            )
            let resumeTxid: string | undefined
            if (resume?.txid) {
                const kept = await resumeVaultTxOrDiscard({
                    txid: resume.txid,
                    drafts: [{ kind: "claim", lobbyPath: input.lobbyPath }],
                })
                resumeTxid = kept ?? undefined
            }
            const txid = await vaultClaimOnChain({
                userId: claim.userId,
                lobbyPath: input.lobbyPath,
                lobbyId: input.lobbyId,
                amountMicro: claim.amountMicro,
                nonce: claim.nonce,
                devWallet: claim.devWallet,
                devFee: claim.devFee,
                devId: claim.devId,
                devNeedsWallet: claim.devNeedsWallet,
                resumeTxid,
                chain: detail.lobby.chain,
            })
            await confirmVaultClaim({
                lobbyId: input.lobbyId,
                amountMicro: claim.amountMicro,
                nonce: claim.nonce,
                vaultTxid: txid,
            })
            await clearVaultDraft("claim", input.lobbyPath).catch(() => undefined)
            claimed += 1
        }
        return { claimed }
    })
}

/** Persist a pending win so the wallet tab can retry claim later. */
export async function savePendingClaimAction(input: {
    lobbyId: string
    lobbyPath: string
    amountMicro: number
    nonce: number
    devWallet: string
    devFee: number
    devId?: string | null
    devNeedsWallet?: boolean
}): Promise<ActionResult<{ ok: true }>> {
    return actionResult(async () => {
        await requireUser()
        if (input.amountMicro <= 0) return { ok: true as const }
        await saveVaultDraft({
            kind: "claim",
            lobbyPath: input.lobbyPath,
            lobbyId: input.lobbyId,
            txid: "",
            entryAmountMicro: 0,
            amountMicro: input.amountMicro,
            nonce: input.nonce,
            devWallet: input.devWallet,
            devFee: input.devFee,
            devId: input.devId,
            devNeedsWallet: input.devNeedsWallet,
        })
        return { ok: true as const }
    })
}

/** Claim from a saved pending-win draft (wallet retry). */
export async function claimPendingWinAction(
    lobbyPath: string
): Promise<ActionResult<{ claimed: number }>> {
    const drafts = await listVaultDrafts("claim").catch(() => [])
    const draft = drafts.find((item) => item.lobbyPath === lobbyPath)
    if (!draft?.lobbyId || !draft.amountMicro || draft.nonce == null) {
        return { ok: false, error: "No pending win found for this lobby." }
    }
    if (
        !draft.devWallet &&
        !(draft.devNeedsWallet && draft.devId)
    ) {
        return { ok: false, error: "Payout is not configured for this win." }
    }
    const me = await requireUser().catch(() => null)
    if (!me) return { ok: false, error: "Sign in to claim." }
    return settleVaultClaimsAction({
        lobbyId: draft.lobbyId,
        lobbyPath: draft.lobbyPath,
        claims: [
            {
                userId: me.id,
                amountMicro: draft.amountMicro,
                nonce: draft.nonce,
                devWallet: draft.devWallet ?? "",
                devFee: draft.devFee ?? 0,
                devId: draft.devId,
                devNeedsWallet: draft.devNeedsWallet,
            },
        ],
    })
}
