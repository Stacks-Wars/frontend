"use client"

import * as React from "react"

import { useQuestsMe } from "@/hooks/use-quests-me"
import {
    applyQuestNudge,
    dailyPeriodId,
    dailyQuestsUnattempted,
    dismissQuestNudge,
} from "@/lib/quest-nudge"
import { useSessionUser } from "@/stores/session"

/** Keeps the bell in sync with today's unattempted dailies. Toasts once per UTC day. */
export function QuestNudgeSync() {
    const user = useSessionUser()
    const query = useQuestsMe()
    const data = query.data

    React.useEffect(() => {
        if (!user || !data) return
        const periodId = dailyPeriodId(data)
        if (!periodId) return
        if (dailyQuestsUnattempted(data)) {
            applyQuestNudge(periodId)
        } else {
            dismissQuestNudge(periodId)
        }
    }, [user, data])

    return null
}
