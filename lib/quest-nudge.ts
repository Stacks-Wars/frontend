"use client"

import type { QuestMe } from "@/lib/api/types"
import { useNotificationsStore } from "@/stores/notifications"

export const QUEST_NUDGE_TITLE = "You have a new quest today"
export const QUEST_NUDGE_BODY = "Don't lose your streak."
export const QUEST_NUDGE_CTA = "See quest"
export const QUEST_NUDGE_HREF = "/quests"

export function questNudgeTag(periodId: string) {
    return `quest:daily:${periodId}`
}

export function dailyPeriodId(me: QuestMe): string | null {
    return me.periods.find((period) => period.kind === "daily")?.id ?? null
}

/** True when today's dailies exist and none have been started or claimed. */
export function dailyQuestsUnattempted(me: QuestMe): boolean {
    const dailies = me.quests.filter((quest) => quest.category === "daily")
    if (dailies.length === 0) return false
    return dailies.every(
        (quest) => quest.progress === 0 && quest.state !== "claimed"
    )
}

function toastStorageKey(periodId: string) {
    return `quest-nudge-toast:${periodId}`
}

function toastAlreadyShown(periodId: string): boolean {
    try {
        return window.localStorage.getItem(toastStorageKey(periodId)) === "1"
    } catch {
        return false
    }
}

function markToastShown(periodId: string) {
    try {
        window.localStorage.setItem(toastStorageKey(periodId), "1")
    } catch {
        /* private mode */
    }
}

export function applyQuestNudge(
    periodId: string,
    options?: { toast?: boolean }
) {
    const tag = questNudgeTag(periodId)
    const store = useNotificationsStore.getState()
    if (!store.items.some((item) => item.tag === tag)) {
        store.actions.push({
            id: tag,
            tag,
            title: QUEST_NUDGE_TITLE,
            body: QUEST_NUDGE_BODY,
            href: QUEST_NUDGE_HREF,
        })
    }
    if (options?.toast === false) return
    if (toastAlreadyShown(periodId)) return
    markToastShown(periodId)
    store.actions.toast({
        title: QUEST_NUDGE_TITLE,
        body: QUEST_NUDGE_BODY,
        href: QUEST_NUDGE_HREF,
        cta: QUEST_NUDGE_CTA,
    })
}

export function dismissQuestNudge(periodId: string) {
    useNotificationsStore
        .getState()
        .actions.dismissByTag(questNudgeTag(periodId))
}
