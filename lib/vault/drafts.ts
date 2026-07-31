/**
 * Pending vault txs that survived broadcast but not lobby creation / leave /
 * claim confirmation. Stored in localStorage so a retry continues from the
 * confirmed txid instead of broadcasting a second join.
 */

export type VaultDraftKind = "create" | "join" | "leave" | "claim"

export type VaultDraft = {
    kind: VaultDraftKind
    userId: string
    lobbyPath: string
    lobbyId?: string
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
    devWallet?: string
    devFee?: number
    paidMicro?: number
    createdAt: number
}

const PREFIX = "sw:vault-draft:"
const MAX_AGE_MS = 24 * 60 * 60 * 1000

function key(kind: VaultDraftKind, userId: string, lobbyPath: string) {
    return `${PREFIX}${kind}:${userId}:${lobbyPath}`
}

function storage(): Storage | null {
    if (typeof window === "undefined") return null
    try {
        return window.localStorage
    } catch {
        return null
    }
}

export function saveVaultDraft(draft: VaultDraft): void {
    const store = storage()
    if (!store) return
    store.setItem(
        key(draft.kind, draft.userId, draft.lobbyPath),
        JSON.stringify({ ...draft, createdAt: draft.createdAt || Date.now() })
    )
}

export function loadVaultDraft(
    kind: VaultDraftKind,
    userId: string,
    lobbyPath?: string
): VaultDraft | null {
    const store = storage()
    if (!store) return null

    if (lobbyPath) {
        return readOne(store, key(kind, userId, lobbyPath))
    }

    // Scan for the newest matching kind/user draft (create retries).
    let newest: VaultDraft | null = null
    for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i)
        if (!k?.startsWith(`${PREFIX}${kind}:${userId}:`)) continue
        const draft = readOne(store, k)
        if (!draft) continue
        if (!newest || draft.createdAt > newest.createdAt) newest = draft
    }
    return newest
}

export function clearVaultDraft(
    kind: VaultDraftKind,
    userId: string,
    lobbyPath: string
): void {
    storage()?.removeItem(key(kind, userId, lobbyPath))
}

export function listVaultDrafts(userId: string): VaultDraft[] {
    const store = storage()
    if (!store) return []
    const out: VaultDraft[] = []
    for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i)
        if (!k?.startsWith(PREFIX) || !k.includes(`:${userId}:`)) continue
        const draft = readOne(store, k)
        if (draft) out.push(draft)
    }
    return out.sort((a, b) => b.createdAt - a.createdAt)
}

function readOne(store: Storage, k: string): VaultDraft | null {
    const raw = store.getItem(k)
    if (!raw) return null
    try {
        const draft = JSON.parse(raw) as VaultDraft
        if (Date.now() - draft.createdAt > MAX_AGE_MS) {
            store.removeItem(k)
            return null
        }
        return draft
    } catch {
        store.removeItem(k)
        return null
    }
}
