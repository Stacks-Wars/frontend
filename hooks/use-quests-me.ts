"use client"

import { useQuery } from "@tanstack/react-query"

import { getMyQuestsAction } from "@/actions/quests"
import type { QuestMe } from "@/lib/api/types"
import { useSessionUser } from "@/stores/session"

export const QUESTS_ME_KEY = ["quests", "me"] as const

export function useQuestsMe(initial?: QuestMe | null) {
    const user = useSessionUser()
    return useQuery({
        queryKey: QUESTS_ME_KEY,
        queryFn: getMyQuestsAction,
        enabled: Boolean(user),
        initialData: initial ?? undefined,
    })
}
