import { cn } from "@/lib/utils"

const MEDALS: Record<number, string> = {
    1: "border-gold/50 bg-gold/15 text-gold",
    2: "border-border-strong bg-surface text-foreground",
    3: "border-warning/40 bg-warning/10 text-warning",
}

export function RankBadge({
    rank,
    className,
}: {
    rank: number
    className?: string
}) {
    return (
        <span
            className={cn(
                "tnum grid size-8 shrink-0 place-items-center rounded-lg border font-display text-sm",
                MEDALS[rank] ?? "border-border/60 text-muted-foreground",
                className
            )}
        >
            {rank}
        </span>
    )
}
