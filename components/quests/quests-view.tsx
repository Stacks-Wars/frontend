"use client"

import * as React from "react"

import { BonusMission } from "@/components/quests/bonus-mission"
import { QuestStep } from "@/components/quests/quest-step"
import { QuestsSkeleton } from "@/components/quests/quests-skeleton"
import { EmptyState, Stat } from "@/components/ui"
import { useQuestsMe } from "@/hooks/use-quests-me"
import type { QuestCategory, QuestMe, QuestView } from "@/lib/api/types"
import {
    layerStats,
    pickNextQuest,
    stepEmphasis,
} from "@/lib/quests"
import { useSessionLoading, useSessionUser } from "@/stores/session"

const LAYERS: {
    id: QuestCategory
    title: string
    hint?: string
}[] = [
    { id: "daily", title: "Today" },
    { id: "weekly", title: "This week" },
    { id: "monthly", title: "This month" },
    { id: "seasonal", title: "This season", hint: "Until the season ends" },
]

function AnimatedPoints({ value }: { value: number }) {
    const [shown, setShown] = React.useState(value)
    const shownRef = React.useRef(value)
    shownRef.current = shown

    React.useEffect(() => {
        const start = shownRef.current
        if (start === value) return
        const delta = value - start
        const origin = performance.now()
        let frame = 0
        const tick = (now: number) => {
            const t = Math.min(1, (now - origin) / 420)
            const next = Math.round(start + delta * t)
            shownRef.current = next
            setShown(next)
            if (t < 1) frame = requestAnimationFrame(tick)
        }
        frame = requestAnimationFrame(tick)
        return () => cancelAnimationFrame(frame)
    }, [value])

    return <span className="tnum">{shown.toLocaleString("en-US")}</span>
}

function GettingStartedPath({ quests }: { quests: QuestView[] }) {
    const allDone = quests.every((q) => q.state === "claimed")
    if (quests.length === 0) return null

    if (allDone) {
        return (
            <p className="text-sm text-muted-foreground">
                Getting Started is complete. You are on the board.
            </p>
        )
    }

    const done = quests.filter((q) => q.state === "claimed").length

    return (
        <section className="space-y-4">
            <div className="space-y-1">
                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                    Getting Started
                </p>
                <h2 className="font-display text-xl sm:text-2xl">
                    Your way in
                </h2>
                <p className="text-sm text-muted-foreground">
                    {done} of {quests.length} complete. This is how you arrive
                    on Stacks Wars.
                </p>
            </div>
            <ol className="ml-0.5">
                {quests.map((quest, index) => (
                    <QuestStep
                        key={quest.id}
                        quest={quest}
                        emphasis={stepEmphasis(quests, index)}
                        path
                        last={index === quests.length - 1}
                    />
                ))}
            </ol>
        </section>
    )
}

function QuestLayer({
    title,
    hint,
    quests,
}: {
    title: string
    hint?: string
    quests: QuestView[]
}) {
    if (quests.length === 0) return null
    const { claimed, claimable, total } = layerStats(quests)

    return (
        <section className="space-y-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <div className="space-y-1">
                    <h2 className="font-display text-xl sm:text-2xl">
                        {title}
                    </h2>
                    {hint ? (
                        <p className="text-sm text-muted-foreground">{hint}</p>
                    ) : null}
                </div>
                <p className="tnum text-xs text-muted-foreground">
                    {claimed}/{total}
                    {claimable > 0 ? ` · ${claimable} ready` : null}
                </p>
            </div>
            <ol>
                {quests.map((quest, index) => (
                    <QuestStep
                        key={quest.id}
                        quest={quest}
                        emphasis={stepEmphasis(quests, index)}
                        path
                        last={index === quests.length - 1}
                    />
                ))}
            </ol>
        </section>
    )
}

function QuestStatus({
    data,
}: {
    data: QuestMe
}) {
    return (
        <>
            <div className="flex flex-col gap-6">
                <Stat
                    label="Quest WP this season"
                    value={
                        <AnimatedPoints
                            value={data.seasonQuestPoints ?? 0}
                        />
                    }
                    tone="gold"
                    hint="Claimed from quests"
                />
                <Stat
                    label="Streak"
                    value={data.streak.current}
                    hint={
                        data.streak.longest > 0
                            ? `Longest ${data.streak.longest} this season`
                            : "Play a match to start"
                    }
                />
            </div>
            {data.bonusMission ? (
                <BonusMission
                    key={data.bonusMission.id}
                    mission={data.bonusMission}
                />
            ) : null}
        </>
    )
}

export function QuestsView({ initial }: { initial?: QuestMe | null }) {
    const user = useSessionUser()
    const sessionLoading = useSessionLoading()
    const query = useQuestsMe(initial)
    const data = query.data ?? null

    if (!data) {
        if (sessionLoading) {
            return <QuestsSkeleton />
        }
        if (!user) {
            return (
                <EmptyState
                    title="Sign in to track quests"
                    description="Progress is saved to your account. Claims pay Wars Points."
                />
            )
        }
        if (query.isPending) {
            return <QuestsSkeleton />
        }
        return (
            <EmptyState
                title="Quests unavailable"
                description="Could not load your quests. Refresh and try again."
            />
        )
    }

    const next = pickNextQuest(data)
    const gettingStarted = data.quests.filter(
        (q) => q.category === "gettingStarted"
    )

    return (
        <div className="flex flex-col gap-12 xl:grid xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
            <div className="space-y-12 xl:col-start-1 xl:row-start-1">
                {next ? (
                    <p className="text-sm">
                        <span className="text-muted-foreground">
                            {next.state === "claimable"
                                ? "Claim now · "
                                : "Up next · "}
                        </span>
                        <span className="font-display text-foreground">
                            {next.title}
                        </span>
                    </p>
                ) : null}
                <GettingStartedPath quests={gettingStarted} />
            </div>

            <aside className="space-y-10 xl:col-start-2 xl:row-start-1 xl:row-span-2 xl:sticky xl:top-24">
                <QuestStatus data={data} />
            </aside>

            <div className="space-y-12 xl:col-start-1 xl:row-start-2">
                {LAYERS.map((layer) => (
                    <QuestLayer
                        key={layer.id}
                        title={layer.title}
                        hint={layer.hint}
                        quests={data.quests.filter(
                            (q) => q.category === layer.id
                        )}
                    />
                ))}
            </div>
        </div>
    )
}
