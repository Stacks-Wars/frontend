"use server"

import {
    claimQuest,
    getMyQuests,
    markQuestIntroSeen,
    submitReferral,
} from "@/lib/api/server"
import type { AppUser, QuestClaimResult, QuestMe } from "@/lib/api/types"

export async function getMyQuestsAction(): Promise<QuestMe> {
    return getMyQuests()
}

export async function claimQuestAction(
    questId: string
): Promise<QuestClaimResult> {
    return claimQuest(questId)
}

export async function submitReferralAction(payload: {
    username?: string
    skip?: boolean
}): Promise<AppUser> {
    return submitReferral(payload)
}

export async function markQuestIntroSeenAction(): Promise<AppUser> {
    return markQuestIntroSeen()
}
