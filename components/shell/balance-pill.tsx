"use client"

import Link from "next/link"
import { RiAddLine } from "@remixicon/react"

import { LiveNumber } from "@/components/common/live-number"
import { Button } from "@/components/ui"
import { formatUsdc } from "@/lib/format"
import { useSessionStore } from "@/stores/session"

/** Balance updates arrive on the private `user:` topic, so no polling here. */
export function BalancePill() {
    const balance = useSessionStore((s) => s.balance)
    const loading = useSessionStore((s) => s.loading)

    if (loading && !balance) {
        return (
            <span className="h-9 w-24 animate-pulse rounded-full bg-muted/60" />
        )
    }

    return (
        <Button
            variant="ghost"
            render={<Link href="/wallet" />}
            className="group h-9 gap-2 rounded-full border border-border/70 bg-surface/60 pr-1.5 pl-3.5 text-sm hover:border-border-strong hover:bg-surface/60"
        >
            <LiveNumber
                value={balance?.availableMicro ?? 0}
                format={(v) => formatUsdc(v, { zero: "$0.00" })}
                className="font-medium"
            />
            <span className="grid size-6 place-items-center rounded-full bg-primary/15 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <RiAddLine className="size-3.5" />
            </span>
        </Button>
    )
}
