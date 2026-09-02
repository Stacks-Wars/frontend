/**
 * Vault abort reasons for Stacks (Clarity u-codes) and Solana (Anchor / SPL /
 * runtime). Kit wraps simulation failures as JSON-RPC -32002 plus a base64
 * payload — expand that before matching.
 *
 * Solana `sw_vault` custom errors start at Anchor 6000:
 *   6000 ZeroAmount, 6001 AlreadySeated, 6002 EmptySeat, 6003 Overflow,
 *   6004 WrongMint, 6005 InsufficientPot, 6006 PathMismatch,
 *   6007 EntryMismatch, 6008 ClaimsStarted, 6009 DevFeeTooHigh,
 *   6010 InvalidSplit.
 * ConstraintDuplicateMutableAccount is 2040 (hex 0x7f8) — winner ATA == dest
 * or platform ATA.
 */

/** Abort reasons that mean the operation already applied — safe to treat as ok. */
const IDEMPOTENT_SUCCESS = [
    /\(err u202\)/i, // ERR-ALREADY-JOINED
    /\bu202\b/i,
    /\(err u203\)/i, // ERR-NOT-JOINED (leave/kick already done)
    /\bu203\b/i,
    /\(err u212\)/i, // ERR-NONCE-USED (claim already settled)
    /\bu212\b/i,
    /AlreadySeated/i,
    /AccountDiscriminatorAlreadySet/i,
    /already in use/i,
    /already processed/i,
    /InsufficientPot/i,
    /you already joined this lobby/i,
    /payout was already claimed/i,
    /already left this lobby/i,
]

/** Kit wraps simulation failures as base64 query strings after `-32002`. */
function expandSolanaKitError(raw: string): string {
    const match = raw.match(/-32002 ['"]([A-Za-z0-9+/=]+)['"]/)
    if (!match) return raw
    try {
        const decoded =
            typeof Buffer !== "undefined"
                ? Buffer.from(match[1], "base64").toString("utf8")
                : atob(match[1])
        return `${raw}\n${decodeURIComponent(decoded.replace(/\+/g, " "))}`
    } catch {
        return raw
    }
}

function customProgramCodes(raw: string): number[] {
    const codes: number[] = []
    for (const match of raw.matchAll(/custom program error:\s*0x([0-9a-f]+)/gi)) {
        codes.push(parseInt(match[1], 16))
    }
    for (const match of raw.matchAll(/Error Number:\s*(\d+)/gi)) {
        codes.push(Number(match[1]))
    }
    for (const match of raw.matchAll(/"Custom"\s*:\s*(\d+)/g)) {
        codes.push(Number(match[1]))
    }
    return [...new Set(codes.filter((n) => Number.isFinite(n)))]
}

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
    const raw = expandSolanaKitError(reason)
    if (IDEMPOTENT_SUCCESS.some((pattern) => pattern.test(raw))) {
        return true
    }
    const codes = customProgramCodes(raw)
    // 6001 AlreadySeated, 6005 InsufficientPot, 3000 seat/config already init.
    return codes.some((code) => code === 6001 || code === 6005 || code === 3000)
}

/**
 * A failed broadcast can never be resumed — the same txid will always fail.
 * Discard the Redis draft and let the user broadcast a fresh transaction.
 */
export function shouldDiscardVaultDraftOnFailure(reason?: string): boolean {
    if (!reason) return true
    if (isIdempotentVaultSuccess(reason)) return false
    return true
}

export function humanizeVaultTxError(reason?: string): string {
    const raw = expandSolanaKitError(
        reason?.trim() || "vault transaction failed"
    )
    const codes = customProgramCodes(raw)

    if (codes.includes(2040) || /DuplicateMutable|duplicate mutable account/i.test(raw)) {
        return "Claim could not send winnings and the game fee to the same wallet. Try again."
    }
    if (codes.includes(6001) || /AlreadySeated/i.test(raw)) {
        return "You already joined this lobby on-chain."
    }
    if (codes.includes(6005) || /InsufficientPot/i.test(raw)) {
        return "This payout was already claimed or the pot is empty."
    }
    if (codes.includes(6008) || /ClaimsStarted/i.test(raw)) {
        return "Claims already started for this lobby."
    }
    if (codes.includes(6002) || /EmptySeat/i.test(raw)) {
        return "You are not in this lobby on-chain."
    }
    if (codes.includes(6007) || /EntryMismatch/i.test(raw)) {
        return "Entry amount does not match this lobby."
    }
    if (codes.includes(6006) || /PathMismatch/i.test(raw)) {
        return "This lobby's on-chain vault does not match."
    }
    if (codes.includes(6004) || /WrongMint/i.test(raw)) {
        return "This lobby is not using the expected USDC mint."
    }
    if (codes.includes(6000) || /ZeroAmount/i.test(raw)) {
        return "Amount must be greater than zero."
    }
    if (codes.includes(6009) || /DevFeeTooHigh/i.test(raw)) {
        return "Game fee is above the 5% cap."
    }
    if (codes.includes(6010) || /InvalidSplit/i.test(raw)) {
        return "Payout split is invalid."
    }
    if (codes.includes(3000) || /AccountDiscriminatorAlreadySet|already in use/i.test(raw)) {
        return "You already joined this lobby on-chain."
    }
    if (
        codes.includes(3012) ||
        codes.includes(2010) ||
        /AccountNotInitialized/i.test(raw)
    ) {
        return "A required token account is missing. Add USDC, then try again."
    }
    if (codes.includes(2012) || /ConstraintAddress/i.test(raw)) {
        return "The platform wallet on this transaction does not match the vault."
    }
    if (
        (codes.includes(1) && codes.every((code) => code < 2000)) ||
        /custom program error:\s*0x1\b/i.test(raw) ||
        /insufficient funds/i.test(raw)
    ) {
        if (/rent/i.test(raw)) {
            return "The platform wallet needs more SOL to cover rent. Try again in a moment."
        }
        return "Not enough USDC to cover the entry. Add funds, then try again."
    }
    if (/InsufficientFundsForRent|insufficient funds for rent/i.test(raw)) {
        return "The platform wallet needs more SOL to cover rent. Try again in a moment."
    }
    if (
        /BlockhashNotFound|blockhash expired|blockhash not found/i.test(raw)
    ) {
        return "The network took too long. Try again."
    }
    if (/already processed/i.test(raw)) {
        return "You already joined this lobby on-chain."
    }
    if (/Timed out waiting for the Solana/i.test(raw)) {
        return "Solana is taking longer than usual. Check pending wins, then retry if needed."
    }
    if (/node is unhealthy|429|rate limit|too many requests/i.test(raw)) {
        return "Solana RPC is busy. Wait a few seconds and try again."
    }

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
    if (/Solana error #-?\d+/i.test(raw) || /InstructionError/i.test(raw)) {
        return "The Solana vault transaction was rejected. Try again."
    }
    return raw.startsWith("(err") ? `Transaction failed: ${raw}` : raw
}
