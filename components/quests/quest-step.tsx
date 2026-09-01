"use client"

import * as React from "react"
import { RiArrowRightLine, RiCheckLine } from "@remixicon/react"

import { Button, ButtonLink, Progress } from "@/components/ui"
import { useClaimQuest } from "@/hooks/use-claim-quest"
import type { QuestView } from "@/lib/api/types"
import { formatQuestProgress, questPercent, type StepEmphasis } from "@/lib/quests"
import { cn } from "@/lib/utils"

export function QuestStep({
    quest,
    emphasis,
    path,
    last = false,
}: {
    quest: QuestView
    emphasis: StepEmphasis
    path?: boolean
    last?: boolean
}) {
    const claim = useClaimQuest()
    const [award, setAward] = React.useState<number | null>(null)
    const pending = claim.isPending && claim.variables === quest.id
    const pct = questPercent(quest)
    const current = emphasis === "current"
    const done = emphasis === "done" || quest.state === "claimed"

    React.useEffect(() => {
        if (award == null) return
        const timer = window.setTimeout(() => setAward(null), 900)
        return () => window.clearTimeout(timer)
    }, [award])

    return (
        <li
            className={cn(
                "relative flex gap-4 transition-opacity duration-300",
                emphasis === "future" && "opacity-45",
                current && "opacity-100"
            )}
        >
            {path ? (
                <div className="flex w-5 shrink-0 flex-col items-center">
                    <span
                        className={cn(
                            "grid size-5 place-items-center rounded-full border text-[10px] leading-none transition-colors",
                            done &&
                                "border-success/40 bg-success/15 text-success",
                            current &&
                                quest.state === "claimable" &&
                                "border-gold bg-gold text-gold-foreground",
                            current &&
                                quest.state !== "claimable" &&
                                "border-primary bg-primary text-primary-foreground",
                            emphasis === "future" &&
                                "border-border bg-background text-muted-foreground"
                        )}
                    >
                        {done ? <RiCheckLine className="size-3" /> : null}
                    </span>
                    {last ? null : (
                        <span
                            className={cn(
                                "mt-1 w-px flex-1",
                                done ? "bg-success/30" : "bg-border"
                            )}
                        />
                    )}
                </div>
            ) : null}

            <div
                className={cn(
                    "min-w-0 flex-1",
                    last ? "pb-0" : "pb-6"
                )}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-0.5">
                        <h3
                            className={cn(
                                "font-display text-base leading-snug",
                                done && "text-muted-foreground",
                                current && "text-foreground"
                            )}
                        >
                            {quest.title}
                        </h3>
                        {current && quest.description ? (
                            <p className="text-sm text-muted-foreground">
                                {quest.description}
                            </p>
                        ) : null}
                    </div>
                    <div className="relative shrink-0 text-right">
                        <p
                            className={cn(
                                "tnum text-sm",
                                quest.state === "claimable"
                                    ? "text-gold"
                                    : "text-muted-foreground"
                            )}
                        >
                            +{quest.rewardPoints} WP
                        </p>
                        {award != null ? (
                            <p className="animate-pop-in pointer-events-none absolute -left-2 top-full text-xs font-medium text-gold">
                                +{award} WP
                            </p>
                        ) : null}
                    </div>
                </div>

                {done ? (
                    <p className="mt-1 text-xs text-muted-foreground">Done</p>
                ) : (
                    <div className="mt-2 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span className="tnum">
                                {formatQuestProgress(quest)}
                            </span>
                        </div>
                        <Progress
                            value={pct}
                            tone={
                                quest.state === "claimable" ? "gold" : "primary"
                            }
                            className={cn(!current && "opacity-70")}
                        />
                        {current ? (
                            <div className="pt-0.5">
                                {quest.state === "claimable" ? (
                                    <Button
                                        size="sm"
                                        variant="gold"
                                        disabled={pending}
                                        onClick={() => {
                                            claim.mutate(quest.id, {
                                                onSuccess: (result) => {
                                                    if (!result.alreadyClaimed) {
                                                        setAward(
                                                            result.rewardPoints
                                                        )
                                                    }
                                                },
                                            })
                                        }}
                                    >
                                        {pending ? "Claiming…" : "Claim"}
                                    </Button>
                                ) : (
                                    <ButtonLink
                                        href={quest.cta.href}
                                        variant="outline"
                                        size="sm"
                                    >
                                        {quest.cta.label}
                                        <RiArrowRightLine />
                                    </ButtonLink>
                                )}
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </li>
    )
}
