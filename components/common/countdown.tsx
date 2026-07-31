"use client"

import * as React from "react"

import { formatClock } from "@/lib/format"
import { cn } from "@/lib/utils"

type Props = {
    seconds: number
    resetKey?: string | number
    onElapsed?: () => void
    className?: string
    warnAt?: number
}

/**
 * Counts down from `seconds`, restarting whenever `resetKey` changes — turn
 * timers reset on every new turn. The remount via `key` is what does the
 * resetting, so the ticker itself never has to reconcile a changed deadline.
 */
export function Countdown({ seconds, resetKey, ...rest }: Props) {
    return <Ticker key={`${resetKey ?? ""}:${seconds}`} seconds={seconds} {...rest} />
}

function Ticker({
    seconds,
    onElapsed,
    className,
    warnAt = 5,
}: Omit<Props, "resetKey">) {
    const [remaining, setRemaining] = React.useState(seconds)
    const elapsedRef = React.useRef(onElapsed)

    React.useEffect(() => {
        elapsedRef.current = onElapsed
    }, [onElapsed])

    React.useEffect(() => {
        if (seconds <= 0) return

        const deadline = Date.now() + seconds * 1000
        const timer = window.setInterval(() => {
            const left = Math.max(0, Math.round((deadline - Date.now()) / 1000))
            setRemaining(left)
            if (left === 0) {
                window.clearInterval(timer)
                elapsedRef.current?.()
            }
        }, 250)

        return () => window.clearInterval(timer)
    }, [seconds])

    return (
        <span
            className={cn(
                "tnum font-display transition-colors",
                remaining <= warnAt ? "text-destructive" : undefined,
                className
            )}
        >
            {formatClock(remaining)}
        </span>
    )
}
