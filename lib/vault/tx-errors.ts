/**
 * Clarity / SIP-010 abort reasons for vault flows.
 *
 * FT transfer codes (sip-010 `ft-transfer?`):
 *   u1 sender balance too low
 *   u2 sender == recipient
 *   u3 non-positive amount
 *   u4 sender is not tx-sender
 *
 * Vault contract codes live in sw-vault-v1.clar (u200+).
 */

/** Abort reasons that mean the operation already applied — safe to treat as ok. */
const IDEMPOTENT_SUCCESS = [
    /\(err u202\)/i, // ERR-ALREADY-JOINED
    /\bu202\b/i,
    /\(err u203\)/i, // ERR-NOT-JOINED (leave/kick already done)
    /\bu203\b/i,
    /\(err u212\)/i, // ERR-NONCE-USED (claim already settled)
    /\bu212\b/i,
]

export const TX_PROCESSING_MESSAGE =
    "Transaction is processing on chain. Please wait."

/** Broadcast succeeded; Hiro has not confirmed yet. */
export class VaultTxPendingError extends Error {
    readonly txid: string
    constructor(txid: string) {
        super(TX_PROCESSING_MESSAGE)
        this.name = "VaultTxPendingError"
        this.txid = txid
    }
}

export function isIdempotentVaultSuccess(reason?: string): boolean {
    if (!reason) return false
    return IDEMPOTENT_SUCCESS.some((pattern) => pattern.test(reason))
}

/**
 * A failed broadcast can never be resumed — the same txid will always fail.
 * Discard the Redis draft and let the user broadcast a fresh tx.
 */
export function shouldDiscardVaultDraftOnFailure(reason?: string): boolean {
    // Keep drafts only when the failure is ambiguous / unknown network blip.
    // Contract aborts and post-condition failures are terminal.
    if (!reason) return true
    if (isIdempotentVaultSuccess(reason)) return false
    return true
}

export function humanizeVaultTxError(reason?: string): string {
    const raw = reason?.trim() || "vault transaction failed"
    if (/\bu1\b/i.test(raw) || /\(err u1\)/i.test(raw)) {
        return "Not enough USDCx to cover the entry. Add funds, then try again."
    }
    if (/\bu3\b/i.test(raw) || /\(err u3\)/i.test(raw)) {
        return "Invalid transfer amount."
    }
    if (/\bu4\b/i.test(raw) || /\(err u4\)/i.test(raw)) {
        return "Wallet could not authorize the transfer."
    }
    if (/\bu201\b/i.test(raw)) return "Entry amount must be greater than zero."
    if (/\bu202\b/i.test(raw)) return "You already joined this lobby on-chain."
    if (/\bu203\b/i.test(raw)) return "You are not in this lobby on-chain."
    if (/\bu204\b/i.test(raw)) return "Entry amount does not match this lobby."
    if (/\bu205\b/i.test(raw)) return "Sponsored flag does not match this lobby."
    if (/\bu208\b/i.test(raw)) {
        return "Host must leave last — remove other players first."
    }
    if (/\bu209\b/i.test(raw)) {
        return "Claims already started for this lobby."
    }
    if (/post.condition|abort_by_post_condition/i.test(raw)) {
        return "Transaction blocked by a wallet post-condition. Try claiming again."
    }
    return raw.startsWith("(err") ? `Transaction failed: ${raw}` : raw
}
