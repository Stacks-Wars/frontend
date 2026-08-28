import { savePendingClaimAction } from "@/actions/lobbies"
import type { VaultClaimIntent } from "@/lib/api/types"
import { settleVaultClaimsOnchain } from "@/lib/onchain"

const inFlight = new Set<string>()

function claimKey(lobbyId: string, nonce: number) {
    return `${lobbyId}:${nonce}`
}

/** True when this claim belongs to the signed-in player and has an amount. */
export function isMyPlaceClaim(
    claim: VaultClaimIntent,
    selfUserId: string | null | undefined
): boolean {
    return (
        Boolean(selfUserId) &&
        claim.userId === selfUserId &&
        claim.amountMicro > 0 &&
        claim.role !== "refund"
    )
}

/**
 * Persist + auto-claim one vault slice. Same path as match-end claims so
 * mid-game `lobby.payout` and reconnect snapshots reuse the existing
 * `vaultClaimOnChain` flow. Idempotent: nonce-used is treated as settled.
 */
export async function claimMyVaultPayout(input: {
    lobbyId: string
    lobbyPath: string
    claim: VaultClaimIntent
    selfUserId: string | null | undefined
}): Promise<{ ok: true } | { ok: false; error: string }> {
    if (!isMyPlaceClaim(input.claim, input.selfUserId)) {
        return { ok: true }
    }

    const key = claimKey(input.lobbyId, input.claim.nonce)
    if (inFlight.has(key)) {
        return { ok: true }
    }
    inFlight.add(key)

    try {
        await savePendingClaimAction({
            lobbyId: input.lobbyId,
            lobbyPath: input.lobbyPath,
            amountMicro: input.claim.amountMicro,
            nonce: input.claim.nonce,
            devWallet: input.claim.devWallet,
            devFee: input.claim.devFee,
            devId: input.claim.devId,
            devNeedsWallet: input.claim.devNeedsWallet,
        }).catch(() => undefined)

        const result = await settleVaultClaimsOnchain({
            lobbyId: input.lobbyId,
            lobbyPath: input.lobbyPath,
            claims: [input.claim],
        })
        if (!result.ok) {
            inFlight.delete(key)
            return { ok: false, error: result.error }
        }
        return { ok: true }
    } catch {
        inFlight.delete(key)
        return { ok: false, error: "Network error." }
    }
}
