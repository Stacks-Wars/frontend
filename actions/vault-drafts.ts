"use server"

import {
    clearVaultDraft,
    listVaultDrafts,
    type VaultDraft,
} from "@/lib/api/server"
import { auth } from "@/lib/auth/server"
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

/**
 * Newest incomplete paid create attempt (broadcast happened, lobby row may not).
 * Prefer a `create` draft (has name/game metadata); fall back to orphan `join`.
 * Terminal aborts (e.g. ft-transfer u1) are discarded so Create Lobby stays clean.
 */
export async function getIncompletePaidCreateDraftAction(): Promise<VaultDraft | null> {
    const { data: session } = await auth.getSession()
    if (!session?.user) return null

    const [createDrafts, joinDrafts] = await Promise.all([
        listVaultDrafts("create").catch(() => []),
        listVaultDrafts("join").catch(() => []),
    ])

    const create = createDrafts.find(
        (draft) =>
            draft.entryAmountMicro > 0 &&
            Boolean(draft.txid?.trim()) &&
            Boolean(draft.lobbyPath?.trim()) &&
            !draft.lobbyId
    )
    if (create) {
        const kept = await keepResumableDraft(create)
        if (kept) return kept
    }

    const join = joinDrafts.find(
        (draft) =>
            draft.entryAmountMicro > 0 &&
            Boolean(draft.txid?.trim()) &&
            Boolean(draft.lobbyPath?.trim()) &&
            !draft.lobbyId
    )
    if (!join) return null
    return keepResumableDraft(join)
}
