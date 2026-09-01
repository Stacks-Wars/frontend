import { formatUsdc } from "@/lib/format"
import type {
    BonusMissionView,
    QuestCategory,
    QuestClaimResult,
    QuestMe,
    QuestView,
} from "@/lib/api/types"

const JOURNEY_ORDER: QuestCategory[] = [
    "gettingStarted",
    "daily",
    "weekly",
    "monthly",
    "seasonal",
]

export type StepEmphasis = "done" | "current" | "future"

export function isMoneyProgress(quest: QuestView): boolean {
    return quest.target >= 1_000_000
}

export function formatQuestProgress(quest: QuestView): string {
    if (isMoneyProgress(quest)) {
        return `${formatUsdc(quest.progress, { zero: "$0" })} / ${formatUsdc(quest.target, { zero: "$0" })}`
    }
    return `${quest.progress} / ${quest.target}`
}

export function questPercent(quest: QuestView): number {
    if (quest.target <= 0) return 0
    return Math.min(100, Math.round((quest.progress / quest.target) * 100))
}

export function stepEmphasis(
    quests: QuestView[],
    index: number
): StepEmphasis {
    const quest = quests[index]
    if (!quest) return "future"
    if (quest.state === "claimed") return "done"
    if (quest.state === "claimable") return "current"
    const firstOpen = quests.findIndex(
        (q) => q.state === "claimable" || q.state === "active"
    )
    if (index === firstOpen) return "current"
    return "future"
}

export function pickNextQuest(me: QuestMe): QuestView | BonusMissionView | null {
    for (const category of JOURNEY_ORDER) {
        const hit = me.quests.find(
            (q) => q.category === category && q.state === "claimable"
        )
        if (hit) return hit
    }
    if (me.bonusMission?.state === "claimable") return me.bonusMission
    for (const category of JOURNEY_ORDER) {
        const hit = me.quests.find(
            (q) => q.category === category && q.state === "active"
        )
        if (hit) return hit
    }
    if (me.bonusMission?.state === "active") return me.bonusMission
    return null
}

export function applyQuestClaim(
    me: QuestMe,
    result: QuestClaimResult
): QuestMe {
    const mark = (quest: QuestView): QuestView =>
        quest.id === result.questId
            ? { ...quest, state: "claimed", progress: quest.target }
            : quest

    const bonus = me.bonusMission
        ? me.bonusMission.id === result.questId
            ? {
                  ...me.bonusMission,
                  state: "claimed" as const,
                  progress: me.bonusMission.target,
              }
            : me.bonusMission
        : null

    return {
        ...me,
        seasonQuestPoints:
            (me.seasonQuestPoints ?? 0) +
            (result.alreadyClaimed ? 0 : result.rewardPoints),
        quests: me.quests.map(mark),
        bonusMission: bonus,
    }
}

export function layerStats(quests: QuestView[]) {
    const claimed = quests.filter((q) => q.state === "claimed").length
    const claimable = quests.filter((q) => q.state === "claimable").length
    return { claimed, claimable, total: quests.length }
}
