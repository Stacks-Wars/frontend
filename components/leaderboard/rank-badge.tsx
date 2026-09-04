import { cn } from "@/lib/utils"

const MEDALS: Record<number, string> = {
    1: "🥇",
    2: "🥈",
    3: "🥉",
}

export function RankBadge({
    rank,
    className,
}: {
    rank: number
    className?: string
}) {
    const medal = MEDALS[rank]
    return (
        <span
            className={cn(
                "tnum grid size-8 shrink-0 place-items-center font-display text-sm",
                medal ? "text-base" : "text-muted-foreground",
                className
            )}
            aria-label={`Rank ${rank}`}
        >
            {medal ?? rank}
        </span>
    )
}
