"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type FeedLine = {
    id: number
    text: string
    tone?: "default" | "good" | "bad" | "muted"
}

const TONE: Record<NonNullable<FeedLine["tone"]>, string> = {
    default: "text-foreground",
    good: "text-success",
    bad: "text-destructive",
    muted: "text-muted-foreground",
}

/**
 * Rolling play-by-play with a fixed height so appending lines can't shove
 * the board around. Scroll stays inside the feed.
 */
export function EventFeed({
    lines,
    className,
    emptyLabel = "Waiting for the first move…",
}: {
    lines: FeedLine[]
    className?: string
    emptyLabel?: string
}) {
    const scrollerRef = React.useRef<HTMLDivElement>(null)

    React.useEffect(() => {
        const node = scrollerRef.current
        if (!node) return
        node.scrollTop = node.scrollHeight
    }, [lines.length])

    return (
        <div
            className={cn(
                "flex h-56 shrink-0 flex-col overflow-hidden rounded-xl border border-border/70 surface-raised",
                className
            )}
        >
            <p className="shrink-0 border-b border-border/60 px-3 py-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Play by play
            </p>
            <div
                ref={scrollerRef}
                className="min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain px-3 py-2.5 text-sm"
            >
                {lines.length === 0 ? (
                    <p className="py-6 text-center text-xs text-muted-foreground">
                        {emptyLabel}
                    </p>
                ) : (
                    lines.map((line) => (
                        <p
                            key={line.id}
                            className={cn(TONE[line.tone ?? "default"])}
                        >
                            {line.text}
                        </p>
                    ))
                )}
            </div>
        </div>
    )
}

/** Bounded append-only log, so a long match can't grow without limit. */
export function useEventFeed(limit = 60) {
    const [lines, setLines] = React.useState<FeedLine[]>([])
    const nextId = React.useRef(0)

    const push = React.useCallback(
        (text: string, tone: FeedLine["tone"] = "default") => {
            nextId.current += 1
            const line = { id: nextId.current, text, tone }
            setLines((prev) => [...prev, line].slice(-limit))
        },
        [limit]
    )

    return { lines, push }
}
