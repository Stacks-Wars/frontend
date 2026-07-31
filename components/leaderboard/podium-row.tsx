import Link from "next/link"
import { RiTrophyLine } from "@remixicon/react"

import { profileHref } from "@/components/common/user-chip"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui"
import type { RankedEntry } from "@/hooks/use-leaderboard"
import { compact, displayNameFor, formatUsdc } from "@/lib/format"
import { cn } from "@/lib/utils"

const ORDER = [1, 0, 2]
const TONES = [
    "border-gold/40 bg-gold/10",
    "border-border-strong",
    "border-warning/30 bg-warning/5",
]

export function PodiumRow({ entries }: { entries: RankedEntry[] }) {
    return (
        <div className="grid gap-3 sm:grid-cols-3">
            {ORDER.map((position) => {
                const entry = entries[position]
                if (!entry) return null
                const name = displayNameFor(entry)
                const href = profileHref(entry)

                const card = (
                    <div
                        className={cn(
                            "flex h-full animate-rise-in flex-col items-center gap-3 rounded-2xl border p-5 text-center transition-transform hover:-translate-y-0.5",
                            TONES[position],
                            position === 0 && "sm:py-7"
                        )}
                    >
                        <span className="relative">
                            <Avatar size={position === 0 ? "lg" : "default"}>
                                {entry.avatarUrl ? (
                                    <AvatarImage src={entry.avatarUrl} alt="" />
                                ) : null}
                                <AvatarFallback seed={name} />
                            </Avatar>
                            {position === 0 ? (
                                <RiTrophyLine className="absolute -top-2 -right-2 size-5 text-gold" />
                            ) : null}
                        </span>

                        <div className="min-w-0">
                            <p className="truncate font-medium">{name}</p>
                            <p className="text-xs text-muted-foreground">
                                {compact(entry.totalWins)} wins ·{" "}
                                {formatUsdc(entry.totalPnl, { sign: true })}
                            </p>
                        </div>

                        <p className="tnum font-display text-2xl text-gold">
                            {compact(entry.points)}
                        </p>
                    </div>
                )

                return href ? (
                    <Link key={entry.userId} href={href}>
                        {card}
                    </Link>
                ) : (
                    <div key={entry.userId}>{card}</div>
                )
            })}
        </div>
    )
}
