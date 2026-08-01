import { RiCalendarLine } from "@remixicon/react"

import { GetDeveloperId } from "@/components/profile/get-developer-id"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui"
import type { UserProfile } from "@/lib/api/types"
import { compact, displayNameFor, formatDate, ordinal } from "@/lib/format"
import { cn } from "@/lib/utils"

export function ProfileHeader({ profile }: { profile: UserProfile }) {
    const { user, lifetime, currentSeasonRank } = profile
    const name = displayNameFor(user)
    const winRate =
        lifetime.totalMatches > 0
            ? (lifetime.totalWins / lifetime.totalMatches) * 100
            : 0
    // Rank and points must come from the same source as the leaderboard.
    const seasonPoints = profile.statLines
        .filter((line) => line.seasonId === profile.currentSeasonId)
        .reduce((total, line) => total + line.points, 0)

    return (
        <header className="relative isolate animate-rise-in overflow-hidden rounded-2xl border border-border/70 surface-raised">
            <div aria-hidden className="absolute inset-0 -z-10 bg-grid" />
            <div
                aria-hidden
                className="absolute inset-0 -z-10 bg-linear-to-r from-primary/15 via-transparent to-gold/10"
            />
            <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6 p-5 sm:p-6">
                <div className="flex min-w-0 items-center gap-4">
                    <Avatar size="xl" className="shrink-0">
                        {user.avatarUrl ? (
                            <AvatarImage src={user.avatarUrl} alt="" />
                        ) : null}
                        <AvatarFallback seed={name} />
                    </Avatar>
                    <div className="min-w-0">
                        <h1 className="truncate font-display text-3xl sm:text-4xl">
                            {name}
                        </h1>
                        {user.username ? (
                            <p className="truncate text-sm text-muted-foreground">
                                @{user.username}
                            </p>
                        ) : null}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <RiCalendarLine className="size-3.5" />
                                Joined {formatDate(user.createdAt)}
                            </p>
                            <GetDeveloperId userId={user.id} />
                        </div>
                    </div>
                </div>

                <dl className="flex flex-wrap items-end gap-x-8 gap-y-4">
                    <Headline
                        label="Season rank"
                        value={
                            currentSeasonRank != null
                                ? ordinal(currentSeasonRank)
                                : "Unranked"
                        }
                        accent={
                            currentSeasonRank != null
                                ? "text-gold"
                                : "text-muted-foreground"
                        }
                    />
                    <Headline
                        label="Season points"
                        value={compact(seasonPoints)}
                    />
                    <Headline
                        label="Win rate"
                        value={`${winRate.toFixed(1)}%`}
                    />
                </dl>
            </div>
        </header>
    )
}

function Headline({
    label,
    value,
    accent,
}: {
    label: string
    value: string
    accent?: string
}) {
    return (
        <div className="space-y-1">
            <dt className="text-[11px] font-medium tracking-[0.16em] text-muted-foreground uppercase">
                {label}
            </dt>
            <dd
                className={cn(
                    "tnum font-display text-2xl leading-none",
                    accent
                )}
            >
                {value}
            </dd>
        </div>
    )
}
