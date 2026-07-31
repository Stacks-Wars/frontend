"use client"

import Link from "next/link"
import * as React from "react"
import { RiTrophyLine } from "@remixicon/react"

import {
    savePendingClaimAction,
    settleVaultClaimsAction,
} from "@/actions/lobbies"
import { UserChip } from "@/components/common/user-chip"
import { Button } from "@/components/ui"
import type { PlayerState } from "@/lib/api/types"
import type { LobbyFinishedPayload } from "@/lib/ws/protocol"
import { formatUsdc, ordinal } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useNotificationsStore } from "@/stores/notifications"
import { useSessionStore } from "@/stores/session"

/**
 * Final standings. Paid winners are claimed on-chain automatically; the
 * payout shows as +$amount on the winner's row.
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
    const toast = useNotificationsStore((s) => s.toast)
    const setBalance = useSessionStore((s) => s.setBalance)
    const claimStarted = React.useRef(false)

    const standings = React.useMemo(
        () =>
            [...players].sort(
                (a, b) => (a.rank ?? Infinity) - (b.rank ?? Infinity)
            ),
        [players]
    )

    const myClaim = finished.claims?.find(
        (claim) => claim.userId === selfUserId && claim.amountMicro > 0
    )

    React.useEffect(() => {
        if (!finished.needsOnChainClaim || !myClaim || claimStarted.current) {
            return
        }
        claimStarted.current = true

        void (async () => {
            await savePendingClaimAction({
                lobbyId: finished.lobbyId,
                lobbyPath: finished.lobbyPath,
                amountMicro: myClaim.amountMicro,
                nonce: myClaim.nonce,
                devWallet: myClaim.devWallet,
                devFee: myClaim.devFee,
            }).catch(() => undefined)

            const result = await settleVaultClaimsAction({
                lobbyId: finished.lobbyId,
                lobbyPath: finished.lobbyPath,
                claims: [myClaim],
            })
            if (!result.ok) {
                toast({
                    title: "Could not claim winnings automatically",
                    body: `${result.error} Retry from Wallet → Pending wins.`,
                    tone: "danger",
                })
                return
            }
            setBalance(null)
            toast({ title: "Winnings claimed", tone: "success" })
        })()
    }, [
        finished.needsOnChainClaim,
        finished.lobbyId,
        finished.lobbyPath,
        myClaim,
        setBalance,
        toast,
    ])

    return (
        <section className="animate-pop-in space-y-5 rounded-2xl border border-gold/30 bg-gold/5 p-6">
            <div className="flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-gold/20 text-gold">
                    <RiTrophyLine />
                </span>
                <div>
                    <h2 className="font-display text-xl">Match complete</h2>
                    <p className="text-sm text-muted-foreground">
                        Season points and stats have been updated.
                    </p>
                </div>
            </div>

            <ol className="divide-y divide-border/50 overflow-hidden rounded-xl border border-border/60 bg-background/40">
                {standings.map((player, index) => {
                    const rank = player.rank ?? index + 1
                    // On-chain settle is winner-take-all (one claim intent). Never
                    // paint that amount on every row — only the claim recipient.
                    // Free / no-claim matches still use per-player prizeMicro.
                    const claimForPlayer = finished.claims?.find(
                        (c) =>
                            c.userId === player.userId && c.amountMicro > 0
                    )
                    const wonMicro =
                        finished.needsOnChainClaim ||
                        (finished.claims?.length ?? 0) > 0
                            ? (claimForPlayer?.amountMicro ?? 0)
                            : (player.prizeMicro ?? 0)

                    return (
                        <li
                            key={player.userId}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3",
                                rank === 1 && "bg-gold/10"
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
                <Button variant="outline" render={<Link href="/lobbies" />}>
                    Find another match
                </Button>
                <Button variant="ghost" render={<Link href="/leaderboard" />}>
                    View leaderboard
                </Button>
            </div>
        </section>
    )
}
