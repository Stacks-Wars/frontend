"use client"

import { cn } from "@/lib/utils"

const PIPS: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8],
}

export function Die({
    value,
    spent,
    rolling,
    className,
}: {
    value: number | null
    spent?: boolean
    rolling?: boolean
    className?: string
}) {
    const pips = value ? (PIPS[value] ?? []) : []

    return (
        <span
            className={cn(
                "grid size-12 grid-cols-3 grid-rows-3 gap-0.5 rounded-xl border border-border-strong bg-surface p-1.5 transition-opacity",
                spent && "opacity-30",
                rolling && "animate-pop-in",
                className
            )}
            aria-label={value ? `Die showing ${value}` : "Die"}
        >
            {Array.from({ length: 9 }).map((_, index) => (
                <span
                    key={index}
                    className={cn(
                        "rounded-full",
                        pips.includes(index) ? "bg-foreground" : "bg-transparent"
                    )}
                />
            ))}
        </span>
    )
}
