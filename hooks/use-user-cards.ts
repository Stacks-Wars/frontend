"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"

import { listUserCardsAction } from "@/actions/games"
import type { UserCard } from "@/lib/api/types"

/**
 * Resolve display names for a set of user ids. Lobby rows and rosters only
 * carry ids, so this fills them in with one batched request.
 */
export function useUserCards(ids: string[]) {
    const key = React.useMemo(
        () => Array.from(new Set(ids.filter(Boolean))).sort(),
        [ids]
    )

    const { data } = useQuery({
        queryKey: ["user-cards", key.join(",")],
        queryFn: () => listUserCardsAction(key),
        enabled: key.length > 0,
        staleTime: 5 * 60_000,
    })

    const byId = React.useMemo(() => {
        const map = new Map<string, UserCard>()
        for (const card of data ?? []) map.set(card.id, card)
        return map
    }, [data])

    return {
        byId,
        get: (id: string): UserCard =>
            byId.get(id) ?? {
                id,
                username: null,
                displayName: null,
                avatarUrl: null,
            },
    }
}
