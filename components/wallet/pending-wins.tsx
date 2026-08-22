"use client"

import * as React from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { RiLoader4Line, RiTrophyLine } from "@remixicon/react"

import { listVaultDraftsAction } from "@/actions/vault-drafts"
import { Badge, Button } from "@/components/ui"
import { formatUsdc } from "@/lib/format"
import { claimPendingWinOnchain } from "@/lib/onchain"
import { useNotificationActions } from "@/stores/notifications"

/**
 * Unclaimed / retryable vault wins. Saved as soon as a paid match finishes so
 * the player can claim from the wallet tab even if the room claim failed mid-flight.
 */
export function PendingWins() {
    const { toast } = useNotificationActions()
    const queryClient = useQueryClient()
    const [claimingPath, setClaimingPath] = React.useState<string | null>(null)

    const { data, isLoading } = useQuery({
        queryKey: ["vault-drafts", "claim"],
        queryFn: () => listVaultDraftsAction("claim"),
    })

    const claims = data ?? []

    async function claim(lobbyPath: string) {
        setClaimingPath(lobbyPath)
        try {
            const result = await claimPendingWinOnchain(lobbyPath)
            if (!result.ok) {
                toast({ title: result.error, tone: "danger" })
                return
            }
            toast({ title: "Winnings claimed", tone: "success" })
            await queryClient.invalidateQueries({
                queryKey: ["vault-drafts", "claim"],
            })
            await queryClient.invalidateQueries({ queryKey: ["activity"] })
        } catch {
            toast({ title: "Claim failed. Try again.", tone: "danger" })
        } finally {
            setClaimingPath(null)
        }
    }

    if (isLoading) return null
    if (claims.length === 0) return null

    return (
        <section className="space-y-3">
            <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-gold/30 bg-gold/5">
                {claims.map((draft) => {
                    const pendingTx = Boolean(draft.txid?.trim())
                    const amount = draft.amountMicro ?? 0
                    return (
                        <li
                            key={`${draft.kind}-${draft.lobbyPath}`}
                            className="flex flex-wrap items-center gap-3 px-4 py-3"
                        >
                            <span className="grid size-9 place-items-center rounded-full bg-gold/20 text-gold">
                                <RiTrophyLine className="size-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium">
                                    Pending win · /{draft.lobbyPath}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {pendingTx
                                        ? "Transaction broadcast — finish confirming the claim."
                                        : "Match reward ready to claim on-chain."}
                                </p>
                            </div>
                            <span className="tnum font-display text-sm text-gold">
                                {formatUsdc(amount)}
                            </span>
                            <Badge variant="outline">
                                {pendingTx ? "Confirming" : "Unclaimed"}
                            </Badge>
                            <Button
                                size="sm"
                                variant="gold"
                                disabled={claimingPath === draft.lobbyPath}
                                onClick={() => claim(draft.lobbyPath)}
                            >
                                {claimingPath === draft.lobbyPath ? (
                                    <RiLoader4Line className="animate-spin" />
                                ) : null}
                                Claim
                            </Button>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
