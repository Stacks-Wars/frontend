"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * A number that briefly lights up when it changes, so realtime counters read
 * as live rather than as a static figure that silently mutates.
 */
export function LiveNumber({
    value,
    format,
    className,
}: {
    value: number
    format?: (value: number) => string
    className?: string
}) {
    const [flash, setFlash] = React.useState(false)
    const previous = React.useRef(value)

    React.useEffect(() => {
        if (previous.current === value) return
        previous.current = value
        setFlash(true)
        const timer = window.setTimeout(() => setFlash(false), 600)
        return () => window.clearTimeout(timer)
    }, [value])

    return (
        <span
            className={cn(
                "tnum transition-colors duration-500",
                flash && "text-primary",
                className
            )}
        >
            {format ? format(value) : value.toLocaleString("en-US")}
        </span>
    )
}
