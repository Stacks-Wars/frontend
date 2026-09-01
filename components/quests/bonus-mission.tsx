"use client"

import * as React from "react"

import { Button, ButtonLink, Progress } from "@/components/ui"
import { useClaimQuest } from "@/hooks/use-claim-quest"
import type { BonusMissionView } from "@/lib/api/types"
import { formatQuestProgress, questPercent } from "@/lib/quests"
import { cn } from "@/lib/utils"

export function BonusMission({ mission }: { mission: BonusMissionView }) {
    const claim = useClaimQuest()
    const [award, setAward] = React.useState<number | null>(null)
    const pending = claim.isPending && claim.variables === mission.id
    const justUnlocked =
        mission.stageIndex > 0 &&
        mission.progress === 0 &&
        mission.state === "active"
    const pct = questPercent(mission)
    const done = mission.state === "claimed"

    React.useEffect(() => {
        setAward(null)
    }, [mission.id])

    React.useEffect(() => {
        if (award == null) return
        const timer = window.setTimeout(() => setAward(null), 900)
        return () => window.clearTimeout(timer)
    }, [award])

    return (
        <section className="animate-rise-in space-y-4">
            <div className="space-y-1">
                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                    {justUnlocked ? "Bonus Mission unlocked" : "Bonus Mission"}
                </p>
                <h2 className="font-display text-xl sm:text-2xl">
                    {mission.title}
                </h2>
                <p className="text-sm text-muted-foreground">
                    {mission.description}
                </p>
            </div>

            <div className="space-y-2">
                <div className="flex items-baseline justify-between gap-3">
                    <span className="tnum text-sm text-muted-foreground">
                        {formatQuestProgress(mission)}
                    </span>
                    <span
                        className={cn(
                            "tnum relative text-sm",
                            mission.state === "claimable"
                                ? "text-gold"
                                : "text-muted-foreground"
                        )}
                    >
                        +{mission.rewardPoints} WP
                        {award != null ? (
                            <span className="animate-pop-in pointer-events-none absolute -bottom-5 right-0 text-xs font-medium text-gold">
                                +{award} WP
                            </span>
                        ) : null}
                    </span>
                </div>
                <Progress
                    value={pct}
                    tone={mission.state === "claimable" ? "gold" : "primary"}
                />
            </div>

            {done ? (
                <p className="text-xs text-muted-foreground">Done</p>
            ) : mission.state === "claimable" ? (
                <Button
                    variant="gold"
                    disabled={pending}
                    onClick={() => {
                        claim.mutate(mission.id, {
                            onSuccess: (result) => {
                                if (!result.alreadyClaimed) {
                                    setAward(result.rewardPoints)
                                }
                            },
                        })
                    }}
                >
                    {pending ? "Claiming…" : "Claim"}
                </Button>
            ) : (
                <ButtonLink href={mission.cta.href} variant="outline" size="sm">
                    {mission.cta.label}
                </ButtonLink>
            )}
        </section>
    )
}
