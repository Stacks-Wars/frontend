"use client"

import * as React from "react"

import { Avatar, AvatarFallback } from "@/components/ui"
import type { ClockReading } from "@/games/checkers/protocol"
import { formatClock } from "@/lib/format"
import { cn } from "@/lib/utils"

export function BankClock({
    remainingMs,
    deadlineAt,
    running,
}: {
    remainingMs: number
    deadlineAt: number | null
    running: boolean
}) {
    const [now, setNow] = React.useState(() => Date.now())

    React.useEffect(() => {
        if (!running) return
        const id = window.setInterval(() => setNow(Date.now()), 200)
        return () => window.clearInterval(id)
    }, [running, deadlineAt])

    const ms =
        running && deadlineAt != null
            ? Math.max(0, deadlineAt - now)
            : Math.max(0, remainingMs)
    const seconds = Math.max(0, Math.ceil(ms / 1000))

    return (
        <span
            className={cn(
                "tnum rounded-md px-2 py-1 font-display text-lg tabular-nums",
                running ? "bg-background/70" : "bg-muted/50 text-muted-foreground",
                seconds <= 30 ? "text-destructive" : undefined
            )}
        >
            {formatClock(seconds)}
        </span>
    )
}

export function ClockStrip({
    name,
    clock,
    deadlineAt,
    running,
}: {
    name: string
    clock: ClockReading | undefined
    deadlineAt: number | null
    running: boolean
}) {
    return (
        <div
            className={cn(
                "flex w-full max-w-[min(560px,100%)] items-center gap-3 py-2",
                running && "rounded-lg bg-primary/10 px-2"
            )}
        >
            <Avatar size="sm">
                <AvatarFallback seed={name} />
            </Avatar>
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
                {name}
            </span>
            <BankClock
                remainingMs={clock?.remainingMs ?? 0}
                deadlineAt={running ? deadlineAt : null}
                running={running}
            />
        </div>
    )
}
