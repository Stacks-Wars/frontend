"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { RiLoader4Line, RiRefreshLine } from "@remixicon/react"

import { getMyActivity, refreshMyBalance } from "@/actions/wallet"
import { Badge, Button, Skeleton } from "@/components/ui"
import { formatUsdc, timeAgo } from "@/lib/format"
import { truncateWallet } from "@/lib/utils"
import { useNotificationActions } from "@/stores/notifications"
import {
    useSessionActions,
    useSessionBalance,
    useSessionCurrentChain,
    useSessionLoading,
} from "@/stores/session"

/** Hiro reports `success` on confirm; everything unsettled is still in flight. */
function isPending(status: string): boolean {
    const value = status.trim().toLowerCase()
    if (value === "success" || value === "confirmed") return false
    return !(
        value === "failed" ||
        value.startsWith("abort_") ||
        value.startsWith("dropped_")
    )
}

export function BalanceCard() {
    const balance = useSessionBalance()
    const loading = useSessionLoading()
    const chain = useSessionCurrentChain()
    const { setBalance } = useSessionActions()
    const { toast } = useNotificationActions()
    const [refreshing, setRefreshing] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const { data: activity } = useQuery({
        queryKey: ["activity", chain],
        queryFn: () => getMyActivity(chain),
    })

    const pending = (activity ?? []).filter((item) =>
        isPending(item.status)
    ).length

    async function refresh() {
        setRefreshing(true)
        setError(null)
        try {
            const next = await refreshMyBalance(chain)
            setBalance(next)
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "Could not refresh balance"
            setError(message)
            toast({
                title: "Could not refresh balance",
                body: err instanceof Error ? err.message : undefined,
                tone: "danger",
            })
        } finally {
            setRefreshing(false)
        }
    }

    return (
        <div className="space-y-4 rounded-2xl border border-border/70 p-5 surface-raised">
            <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        Available
                    </p>
                    {balance ? (
                        <p className="tnum font-display text-4xl sm:text-5xl">
                            {formatUsdc(balance.availableMicro, {
                                zero: "$0.00",
                            })}
                        </p>
                    ) : loading ? (
                        <Skeleton className="h-12 w-40" />
                    ) : (
                        <p className="tnum font-display text-4xl sm:text-5xl">
                            $0.00
                        </p>
                    )}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void refresh()}
                    disabled={refreshing}
                >
                    {refreshing ? (
                        <RiLoader4Line className="animate-spin" />
                    ) : (
                        <RiRefreshLine />
                    )}
                    Refresh
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                {balance ? (
                    <span className="font-mono text-xs text-muted-foreground">
                        {truncateWallet(balance.address)}
                    </span>
                ) : null}
                {balance ? (
                    <span className="text-xs text-muted-foreground">
                        Updated {timeAgo(balance.updatedAt)}
                    </span>
                ) : null}
                {pending > 0 ? (
                    <Badge variant="warning" className="tnum">
                        {pending} pending {pending === 1 ? "tx" : "txs"}
                    </Badge>
                ) : null}
            </div>

            {error ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            ) : null}
        </div>
    )
}
