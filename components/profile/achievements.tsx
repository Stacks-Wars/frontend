import {
    RiCoinLine,
    RiFireLine,
    RiMedalLine,
    RiSwordLine,
    RiTrophyLine,
    RiVipCrownLine,
} from "@remixicon/react"

import { Progress } from "@/components/ui"
import type { UserProfile } from "@/lib/api/types"
import { cn } from "@/lib/utils"

type Achievement = {
    id: string
    label: string
    hint: string
    icon: React.ReactNode
    progress: number
    target: number
}

/** Everything here is derived from stats the profile already returns. */
function build(profile: UserProfile): Achievement[] {
    const { lifetime, favouriteGames, currentSeasonRank } = profile
    const winRateBps =
        lifetime.totalMatches > 0
            ? Math.round((lifetime.totalWins / lifetime.totalMatches) * 100)
            : 0

    return [
        {
            id: "first-win",
            label: "First blood",
            hint: "Win a match",
            icon: <RiTrophyLine />,
            progress: Math.min(lifetime.totalWins, 1),
            target: 1,
        },
        {
            id: "regular",
            label: "Regular",
            hint: "Play 10 matches",
            icon: <RiSwordLine />,
            progress: Math.min(lifetime.totalMatches, 10),
            target: 10,
        },
        {
            id: "generalist",
            label: "Generalist",
            hint: "Play 3 different games",
            icon: <RiMedalLine />,
            progress: Math.min(favouriteGames.length, 3),
            target: 3,
        },
        {
            id: "sharp",
            label: "Sharp",
            hint: "Hold a 60% win rate over 5 matches",
            icon: <RiFireLine />,
            progress:
                lifetime.totalMatches >= 5 ? Math.min(winRateBps, 60) : 0,
            target: 60,
        },
        {
            id: "in-the-money",
            label: "In the money",
            hint: "Win a paid pot",
            icon: <RiCoinLine />,
            progress: lifetime.totalWinningsMicro > 0 ? 1 : 0,
            target: 1,
        },
        {
            id: "contender",
            label: "Contender",
            hint: "Finish a season in the top 10",
            icon: <RiVipCrownLine />,
            progress:
                currentSeasonRank != null && currentSeasonRank <= 10 ? 1 : 0,
            target: 1,
        },
    ]
}

export function Achievements({ profile }: { profile: UserProfile }) {
    const achievements = build(profile)

    return (
        <ul className="grid gap-2 sm:grid-cols-2">
            {achievements.map((achievement, index) => {
                const earned = achievement.progress >= achievement.target
                return (
                    <li
                        key={achievement.id}
                        className={cn(
                            "stagger animate-rise-in flex items-center gap-3 rounded-xl border p-3",
                            earned
                                ? "border-gold/40 bg-gold/5"
                                : "border-border/70 surface-raised"
                        )}
                        style={{ "--index": index } as React.CSSProperties}
                    >
                        <span
                            className={cn(
                                "grid size-9 shrink-0 place-items-center rounded-lg",
                                earned
                                    ? "bg-gold/15 text-gold"
                                    : "bg-muted/50 text-muted-foreground"
                            )}
                        >
                            {achievement.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                            <span
                                className={cn(
                                    "block truncate text-sm font-medium",
                                    !earned && "text-muted-foreground"
                                )}
                            >
                                {achievement.label}
                            </span>
                            <span className="block truncate text-xs text-muted-foreground">
                                {achievement.hint}
                            </span>
                            {earned ? null : (
                                <Progress
                                    className="mt-1.5"
                                    value={
                                        (achievement.progress /
                                            achievement.target) *
                                        100
                                    }
                                />
                            )}
                        </span>
                    </li>
                )
            })}
        </ul>
    )
}
