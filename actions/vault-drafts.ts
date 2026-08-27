"use server"

import { listLobbies, listVaultDrafts, clearVaultDraft } from "@/lib/api/server"
import type { HostedLobbyRef, VaultDraft } from "@/lib/api/types"
import { auth } from "@/lib/auth/server"
import {
    ACTIVE_HOST_STATUSES,
    toHostedLobbyRef,
} from "@/lib/lobby/host-cap"
import { peekTx } from "@/lib/tx/wait-for-tx"
import { isIdempotentVaultSuccess } from "@/lib/vault/tx-errors"

export async function listVaultDraftsAction(
    kind?: string
): Promise<VaultDraft[]> {
    const { data: session } = await auth.getSession()
    if (!session?.user) return []
    return listVaultDrafts(kind).catch(() => [])
}

async function keepResumableDraft(
    draft: VaultDraft
): Promise<VaultDraft | null> {
    if (!draft.txid?.trim() || !draft.lobbyPath?.trim()) return null
    const peek = await peekTx(draft.txid)
    if (peek.status === "failed" && !isIdempotentVaultSuccess(peek.reason)) {
        await clearVaultDraft(draft.kind, draft.lobbyPath).catch(() => undefined)
        if (draft.kind === "create") {
            await clearVaultDraft("join", draft.lobbyPath).catch(() => undefined)
        }
        return null
    }
    return draft
}

export type CreateLobbyGate = {
    draft: VaultDraft | null
    activeLobbies: HostedLobbyRef[]
}

/**
 * Newest incomplete paid create attempt (broadcast happened, lobby row may not),
 * plus the caller's unfinished hosted lobbies for the two-lobby cap.
 */
export async function getIncompletePaidCreateDraftAction(): Promise<CreateLobbyGate> {
    const { data: session } = await auth.getSession()
    if (!session?.user) {
        return { draft: null, activeLobbies: [] }
    }

    const userId = session.user.id
    const [createDrafts, joinDrafts, hosted] = await Promise.all([
        listVaultDrafts("create").catch(() => []),
        listVaultDrafts("join").catch(() => []),
        userId
            ? listLobbies({
                  creatorId: userId,
                  status: [...ACTIVE_HOST_STATUSES],
                  limit: 8,
              }).catch(() => [])
            : Promise.resolve([]),
    ])

    const activeLobbies = hosted.map(toHostedLobbyRef)

    const create = createDrafts.find(
        (draft) =>
            draft.entryAmountMicro > 0 &&
            Boolean(draft.txid?.trim()) &&
            Boolean(draft.lobbyPath?.trim()) &&
            !draft.lobbyId
    )
    if (create) {
        const kept = await keepResumableDraft(create)
        if (kept) return { draft: kept, activeLobbies }
    }

    const join = joinDrafts.find(
        (draft) =>
            draft.entryAmountMicro > 0 &&
            Boolean(draft.txid?.trim()) &&
            Boolean(draft.lobbyPath?.trim()) &&
            !draft.lobbyId
    )
    if (!join) return { draft: null, activeLobbies }
    return { draft: await keepResumableDraft(join), activeLobbies }
}
