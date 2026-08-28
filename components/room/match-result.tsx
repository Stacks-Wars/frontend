"use client"

import * as React from "react"
import { RiTrophyLine } from "@remixicon/react"

import { UserChip } from "@/components/common/user-chip"
import { ButtonLink } from "@/components/ui"
import type { PlayerState } from "@/lib/api/types"
import type { LobbyFinishedPayload } from "@/lib/ws/protocol"
import { formatUsdc, ordinal } from "@/lib/format"
import { refundDrawSeatsOnchain } from "@/lib/onchain"
import { claimMyVaultPayout, isMyPlaceClaim } from "@/lib/vault/claim-payout"
import { cn } from "@/lib/utils"
import { useNotificationActions } from "@/stores/notifications"

/**
 * Final standings. Paid places are claimed on-chain automatically; the
 * payout shows as +$amount on that player's row.
 */
export function MatchResult({
    finished,
    players,
    selfUserId,
}: {
    finished: LobbyFinishedPayload
    players: PlayerState[]
    selfUserId: string | null
}) {
    const { toast } = useNotificationActions()
    const claimStarted = React.useRef(false)
    const refundStarted = React.useRef(false)
    const isDraw = finished.winners.length === 0
    const refundClaims = React.useMemo(
        () =>
            (finished.claims ?? []).filter((claim) => claim.role === "refund"),
        [finished.claims]
    )

    const standings = React.useMemo(() => {
        if (finished.standings?.length) {
            const byUser = new Map(players.map((p) => [p.userId, p]))
            return [...finished.standings]
                .sort((a, b) => a.rank - b.rank)
                .map((row, index) => {
                    const player = byUser.get(row.userId)
                    return {
                        userId: row.userId,
                        username: player?.username ?? null,
                        displayName: player?.displayName ?? null,
                        status: player?.status ?? "joined",
                        state: player?.state ?? "accepted",
                        rank: row.rank ?? index + 1,
                        prizeMicro:
                            row.prizeMicro !== undefined
                                ? row.prizeMicro
                                : (player?.prizeMicro ?? null),
                        warsPoint:
                            row.warsPoint !== undefined
                                ? row.warsPoint
                                : (player?.warsPoint ?? null),
                        isCreator: player?.isCreator ?? false,
                        ready: player?.ready ?? false,
                        joinedAt: player?.joinedAt ?? 0,
                        updatedAt: player?.updatedAt ?? 0,
                    } satisfies PlayerState
                })
        }

        return [...players].sort((a, b) => {
            const rankA = a.rank ?? Infinity
            const rankB = b.rank ?? Infinity
            if (rankA !== rankB) return rankA - rankB
            // Stable fallback: winners first, then join order.
            const winA = finished.winners.includes(a.userId) ? 0 : 1
            const winB = finished.winners.includes(b.userId) ? 0 : 1
            if (winA !== winB) return winA - winB
            return a.joinedAt - b.joinedAt
        })
    }, [finished.standings, finished.winners, players])

    const myClaim = finished.claims?.find((claim) =>
        isMyPlaceClaim(claim, selfUserId)
    )

    React.useEffect(() => {
        if (!finished.needsOnChainRefund || refundClaims.length === 0) {
            return
        }
        if (refundStarted.current) return
        refundStarted.current = true
        void (async () => {
            const result = await refundDrawSeatsOnchain({
                lobbyId: finished.lobbyId,
                lobbyPath: finished.lobbyPath,
                claims: refundClaims.map((claim) => ({
                    userId: claim.userId,
                    principal: claim.principal,
                    amountMicro: claim.amountMicro,
                    nonce: claim.nonce,
                    devWallet: claim.devWallet,
                    devFee: claim.devFee,
                    role: "refund",
                })),
            })
            if (!result.ok) {
                toast({
                    title: "Could not return entry fees automatically",
                    body: result.error,
                    tone: "danger",
                })
            }
        })()
    }, [
        finished.needsOnChainRefund,
        finished.lobbyId,
        finished.lobbyPath,
        refundClaims,
        toast,
    ])

    React.useEffect(() => {
        if (!finished.needsOnChainClaim || !myClaim || claimStarted.current) {
            return
        }
        claimStarted.current = true

        void (async () => {
            const result = await claimMyVaultPayout({
                lobbyId: finished.lobbyId,
                lobbyPath: finished.lobbyPath,
                claim: myClaim,
                selfUserId,
            })
            if (!result.ok) {
                toast({
                    title: "Could not claim winnings automatically",
                    body: `${result.error} Retry from Wallet → Pending wins.`,
                    tone: "danger",
                })
            }
        })()
    }, [
        finished.needsOnChainClaim,
        finished.lobbyId,
        finished.lobbyPath,
        myClaim,
        selfUserId,
        toast,
    ])

    return (
        <section className="animate-pop-in space-y-5 rounded-2xl border border-gold/30 bg-gold/5 p-6">
            <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-gold/20 text-gold">
                    <RiTrophyLine />
                </span>
                <div>
                    <h2 className="font-display text-xl">
                        {isDraw ? "Draw" : "Match complete"}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        {isDraw
                            ? "Paid entries are returned in full."
                            : "Season points and stats have been updated."}
                    </p>
                </div>
            </div>

            <ol className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-background/40">
                {standings.map((player, index) => {
                    const rank = player.rank ?? index + 1
                    // Paid matches show the claim slice (70/30 or 50/30/20).
                    // Free / no-claim matches still use per-player prizeMicro.
                    const claimForPlayer = finished.claims?.find(
                        (c) =>
                            c.userId === player.userId &&
                            c.amountMicro > 0 &&
                            (isDraw ? c.role === "refund" : c.role !== "refund")
                    )
                    const wonMicro =
                        finished.needsOnChainClaim ||
                        finished.needsOnChainRefund ||
                        (finished.claims?.length ?? 0) > 0
                            ? (claimForPlayer?.amountMicro ?? 0)
                            : (player.prizeMicro ?? 0)

                    return (
                        <li
                            key={player.userId}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3",
                                rank === 1 && !isDraw && "bg-gold/10"
                            )}
                        >
                            <span
                                className={cn(
                                    "tnum w-8 font-display text-sm",
                                    rank === 1
                                        ? "text-gold"
                                        : "text-muted-foreground"
                                )}
                            >
                                {ordinal(rank)}
                            </span>
                            <UserChip user={player} size="xs" />
                            <span className="ml-auto text-right">
                                {player.warsPoint != null ? (
                                    <span className="block text-xs text-muted-foreground">
                                        +{player.warsPoint} pts
                                    </span>
                                ) : null}
                            </span>
                            {wonMicro > 0 ? (
                                <span className="tnum shrink-0 font-display text-sm text-gold">
                                    {formatUsdc(wonMicro, { sign: true })}
                                </span>
                            ) : null}
                        </li>
                    )
                })}
            </ol>

            <div className="flex flex-wrap gap-2">
                <ButtonLink href="/lobbies" variant="outline">
                    Find another match
                </ButtonLink>
                <ButtonLink href="/leaderboard" variant="ghost">
                    View leaderboard
                </ButtonLink>
            </div>
        </section>
    )
}
