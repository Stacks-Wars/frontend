"use client"

import { ButtonLink, Card, CardContent, Progress } from "@/components/ui"
import { useQuestsMe } from "@/hooks/use-quests-me"
import type { QuestView } from "@/lib/api/types"

const ACTION_IDS = ["gs.username", "gs.host", "gs.join", "gs.win"] as const

export function GettingStartedRail() {
    const query = useQuestsMe()
    const data = query.data
    if (!data) return null

    const gs = data.quests.filter((q) => ACTION_IDS.includes(q.id as (typeof ACTION_IDS)[number]))
    if (gs.length === 0) return null
    if (gs.every((q) => q.state === "claimed")) return null

    const done = gs.filter((q) => q.progress >= q.target).length

    return (
        <Card>
            <CardContent className="space-y-4 p-5 sm:p-6">
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div className="space-y-1">
                        <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                            Getting Started
                        </p>
                        <h2 className="font-display text-xl">Get on the board</h2>
                        <p className="text-sm text-muted-foreground">
                            {done} of {gs.length} complete. Claim them on Quests.
                        </p>
                    </div>
                    <ButtonLink href="/quests" size="sm">
                        Open quests
                    </ButtonLink>
                </div>
                <Progress
                    value={Math.round((done / gs.length) * 100)}
                    tone="gold"
                />
                <ol className="space-y-2">
                    {gs.map((quest) => (
                        <RailItem key={quest.id} quest={quest} />
                    ))}
                </ol>
            </CardContent>
        </Card>
    )
}

function RailItem({ quest }: { quest: QuestView }) {
    const done = quest.progress >= quest.target
    return (
        <li className="flex items-center justify-between gap-3 py-1">
            <div className="min-w-0">
                <p className="truncate text-sm font-medium">{quest.title}</p>
                <p className="text-xs text-muted-foreground">
                    {done
                        ? quest.state === "claimed"
                            ? "Claimed"
                            : "Ready to claim"
                        : quest.description}
                </p>
            </div>
            {done && quest.state !== "claimed" ? (
                <ButtonLink href="/quests" variant="outline" size="sm">
                    Claim
                </ButtonLink>
            ) : !done ? (
                <ButtonLink href={quest.cta.href} variant="outline" size="sm">
                    {quest.cta.label}
                </ButtonLink>
            ) : null}
        </li>
    )
}
