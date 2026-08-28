import type {
    claimPendingWinAction,
    createLobbyAction,
    refundDrawSeatsAction,
    settleVaultClaimsAction,
} from "@/actions/lobbies"
import type { withdrawAction } from "@/actions/wallet"
import type { ActionResult } from "@/lib/action-result"
import type { LobbyDetail, WalletBalance } from "@/lib/api/types"

/**
 * Call the long-running `/api/onchain` function. Server actions inherit the
 * calling page's duration; this route is the only 60s override.
 */
async function postOnchain<T>(
    op: string,
    body: unknown
): Promise<ActionResult<T>> {
    try {
        const res = await fetch(`/api/onchain/${op}`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(body),
        })
        const json = (await res.json().catch(() => null)) as
            | ActionResult<T>
            | null
        if (json && typeof json === "object" && "ok" in json) {
            return json
        }
        return { ok: false, error: "Network error." }
    } catch {
        return { ok: false, error: "Network error." }
    }
}

export function createLobbyOnchain(
    input: Parameters<typeof createLobbyAction>[0]
) {
    return postOnchain<LobbyDetail>("create", input)
}

export function joinLobbyOnchain(lobbyId: string) {
    return postOnchain<LobbyDetail>("join", { lobbyId })
}

export function leaveLobbyOnchain(lobbyId: string) {
    return postOnchain<LobbyDetail>("leave", { lobbyId })
}

export function kickLobbyPlayerOnchain(lobbyId: string, targetUserId: string) {
    return postOnchain<LobbyDetail>("kick", { lobbyId, targetUserId })
}

export function settleVaultClaimsOnchain(
    input: Parameters<typeof settleVaultClaimsAction>[0]
) {
    return postOnchain<{ claimed: number }>("claim", input)
}

export function refundDrawSeatsOnchain(
    input: Parameters<typeof refundDrawSeatsAction>[0]
) {
    return postOnchain<{ refunded: number }>("draw-refund", input)
}

export function claimPendingWinOnchain(
    lobbyPath: Parameters<typeof claimPendingWinAction>[0]
) {
    return postOnchain<{ claimed: number }>("claim-pending", { lobbyPath })
}

export function withdrawOnchain(input: Parameters<typeof withdrawAction>[0]) {
    return postOnchain<{ txid: string; balance: WalletBalance }>(
        "withdraw",
        input
    )
}

export function claimTestUsdcOnchain() {
    return postOnchain<{
        minted: boolean
        signature: string | null
        amountMicro: number
        balance: WalletBalance
    }>("claim-usdc", {})
}
