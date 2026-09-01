"use client"

import { useMutation, useQueryClient } from "@tanstack/react-query"

import { claimQuestAction } from "@/actions/quests"
import { QUESTS_ME_KEY } from "@/hooks/use-quests-me"
import type { QuestClaimResult, QuestMe } from "@/lib/api/types"
import { playSfx } from "@/lib/audio/play-sound"
import { applyQuestClaim } from "@/lib/quests"
import { useNotificationActions } from "@/stores/notifications"

export function useClaimQuest() {
    const queryClient = useQueryClient()
    const notify = useNotificationActions()

    return useMutation({
        mutationFn: (questId: string) => claimQuestAction(questId),
        onSuccess: (result: QuestClaimResult) => {
            queryClient.setQueryData<QuestMe>(QUESTS_ME_KEY, (current) =>
                current ? applyQuestClaim(current, result) : current
            )
            void queryClient.invalidateQueries({ queryKey: QUESTS_ME_KEY })
            if (!result.alreadyClaimed) playSfx("success")
            notify.toast({
                title: result.alreadyClaimed
                    ? "Already claimed"
                    : `+${result.rewardPoints} WP`,
                tone: "success",
            })
        },
        onError: (err) => {
            notify.toast({
                title: "Could not claim",
                body: err instanceof Error ? err.message : "Try again.",
                tone: "danger",
            })
        },
    })
}
