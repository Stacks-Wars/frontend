"use client"

import { Countdown } from "@/components/common/countdown"
import { Avatar, AvatarFallback } from "@/components/ui"
import { cn } from "@/lib/utils"

/** Whose turn it is. The shot clock only renders on your turn. */
export function TurnBar({
    name,
    isYou,
    timeoutSecs,
    resetKey,
    hint,
    className,
}: {
    name: string | null
    isYou: boolean
    timeoutSecs?: number | null
    resetKey?: string | number
    hint?: React.ReactNode
    className?: string
}) {
    const showClock = Boolean(isYou && timeoutSecs && timeoutSecs > 0)

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-xl border px-4 py-3 transition-colors",
                isYou
                    ? "border-primary/50 bg-primary/10"
                    : "border-border/70 bg-surface/50",
                className
            )}
        >
            {name ? (
                <Avatar size="sm">
                    <AvatarFallback seed={name} />
                </Avatar>
            ) : null}
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                    {name
                        ? isYou
                            ? "Your turn"
                            : `${name}'s turn`
                        : "Waiting for the next turn"}
                </p>
                {hint ? (
                    <p className="truncate text-xs text-muted-foreground">
                        {hint}
                    </p>
                ) : null}
            </div>
            {showClock ? (
                <Countdown
                    seconds={timeoutSecs!}
                    resetKey={resetKey}
                    className="text-lg"
                />
            ) : null}
        </div>
    )
}
