"use client"

import Link from "next/link"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { RiHistoryLine } from "@remixicon/react"

import { getMyActivity } from "@/actions/wallet"
import { Badge, EmptyState, Skeleton } from "@/components/ui"
import type { ChainActivityItem, ChainActivityKind } from "@/lib/api/types"
import { formatUsdc, timeAgo } from "@/lib/format"
import { hiroExplorerTxUrl } from "@/lib/stacks/explorer"
import { cn, truncateWallet } from "@/lib/utils"

type TxState = "confirmed" | "failed" | "pending"
type FilterId =
    | "all"
    | "deposits"
    | "withdrawals"
    | "lobby"
    | "winnings"
    | "gameFee"

const KINDS: Record<
    ChainActivityKind,
    { label: string; direction: "in" | "out" | "neutral" }
> = {
    deposit: { label: "Deposit", direction: "in" },
    withdraw: { label: "Withdrawal", direction: "out" },
    vaultJoin: { label: "Lobby entry", direction: "out" },
    vaultLeave: { label: "Entry refund", direction: "in" },
    vaultKick: { label: "Removed refund", direction: "in" },
    vaultClaim: { label: "Winnings", direction: "in" },
    vaultDevFee: { label: "Game fee", direction: "in" },
    other: { label: "On-chain", direction: "neutral" },
}

const FILTERS: { id: FilterId; label: string; kinds?: ChainActivityKind[] }[] =
    [
        { id: "all", label: "All" },
        { id: "deposits", label: "Deposits", kinds: ["deposit"] },
        { id: "withdrawals", label: "Withdrawals", kinds: ["withdraw"] },
        {
            id: "lobby",
            label: "Lobby",
            kinds: ["vaultJoin", "vaultLeave", "vaultKick"],
        },
        { id: "winnings", label: "Winnings", kinds: ["vaultClaim"] },
        { id: "gameFee", label: "Game fee", kinds: ["vaultDevFee"] },
    ]

/** Hiro reports `success` on confirm; anything unsettled is still in flight. */
function txState(status: string): TxState {
    const value = status.trim().toLowerCase()
    if (value === "success" || value === "confirmed") return "confirmed"
    if (
        value === "failed" ||
        value.startsWith("abort_") ||
        value.startsWith("dropped_")
    ) {
        return "failed"
    }
    return "pending"
}

export function TransactionList() {
    const [filter, setFilter] = React.useState<FilterId>("all")

    const { data, isLoading, error } = useQuery({
        queryKey: ["activity"],
        queryFn: getMyActivity,
    })

    const items = React.useMemo(() => {
        const kinds = FILTERS.find((entry) => entry.id === filter)?.kinds
        const list = kinds
            ? (data ?? []).filter((item) => kinds.includes(item.kind))
            : (data ?? [])
        return [...list].sort((a, b) => (b.blockTime ?? 0) - (a.blockTime ?? 0))
    }, [data, filter])

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-1.5">
                {FILTERS.map((entry) => (
                    <button
                        key={entry.id}
                        type="button"
                        onClick={() => setFilter(entry.id)}
                        className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                            filter === entry.id
                                ? "border-primary bg-primary/15 text-primary"
                                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                        )}
                    >
                        {entry.label}
                    </button>
                ))}
            </div>

            {error ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error instanceof Error
                        ? error.message
                        : "Could not load your transactions."}
                </p>
            ) : isLoading ? (
                <div className="space-y-2 rounded-2xl border border-border/70 p-4 surface-raised">
                    {Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton key={index} className="h-12" />
                    ))}
                </div>
            ) : items.length === 0 ? (
                <EmptyState
                    icon={<RiHistoryLine />}
                    title="No transactions yet"
                    description="Deposits, entries, refunds, and winnings all land here."
                />
            ) : (
                <ul className="divide-y divide-border/60 rounded-2xl border border-border/70 surface-raised">
                    {items.map((item, index) => (
                        <TransactionRow
                            key={`${item.txid}-${item.kind}-${index}`}
                            item={item}
                            index={index}
                        />
                    ))}
                </ul>
            )}
        </div>
    )
}

function TransactionRow({
    item,
    index,
}: {
    item: ChainActivityItem
    index: number
}) {
    const { label, direction } = KINDS[item.kind]
    const state = txState(item.status)
    const signedMicro =
        direction === "out" ? -Math.abs(item.amountMicro) : item.amountMicro

    return (
        <li
            className={cn(
                "flex animate-rise-in flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 stagger",
                state === "pending" && "opacity-70"
            )}
            style={{ "--index": index } as React.CSSProperties}
        >
            <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    {label}
                    {item.lobbyPath ? (
                        <Link
                            href={`/room/${item.lobbyPath}`}
                            className="text-xs font-normal text-primary hover:underline"
                        >
                            /{item.lobbyPath}
                        </Link>
                    ) : null}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>{timeAgo(item.blockTime)}</span>
                    <a
                        href={hiroExplorerTxUrl(item.txid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-primary hover:underline"
                        title="Open on Hiro explorer"
                    >
                        {truncateWallet(item.txid)}
                    </a>
                </p>
            </div>

            <span
                className={cn(
                    "tnum font-display text-sm",
                    direction === "in" && "text-success",
                    state === "failed" && "text-muted-foreground line-through"
                )}
            >
                {formatUsdc(signedMicro, {
                    zero: "$0.00",
                    sign: direction === "in",
                })}
            </span>

            {state === "pending" ? (
                <span className="inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                    <span className="size-1.5 shrink-0 animate-live-pulse rounded-full bg-warning" />
                    Pending
                </span>
            ) : state === "failed" ? (
                <Badge variant="destructive">Failed</Badge>
            ) : (
                <Badge variant="outline">Confirmed</Badge>
            )}
        </li>
    )
}
