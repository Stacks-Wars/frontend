"use client"

import * as React from "react"

import type { GameActivity } from "@/lib/api/types"
import { useLiveStore } from "@/stores/live"

const EMPTY: GameActivity = {
    gameId: "",
    waitingLobbies: 0,
    liveLobbies: 0,
    activePlayers: 0,
    openPotMicro: 0,
}

/**
 * Per-game live counters, seeded from the server render and then updated by
 * `games.activity` broadcasts whenever a lobby is created, joined, or ends.
 */
export function useGameActivity(initial: GameActivity[] = []) {
    const activity = useLiveStore((s) => s.activity)
    const setActivity = useLiveStore((s) => s.setActivity)
    const seededRef = React.useRef(false)

    React.useEffect(() => {
        if (seededRef.current || initial.length === 0) return
        seededRef.current = true
        setActivity(initial)
    }, [initial, setActivity])

    const byGame = React.useMemo(
        () =>
            Object.keys(activity).length > 0
                ? activity
                : Object.fromEntries(initial.map((item) => [item.gameId, item])),
        [activity, initial]
    )

    const get = React.useCallback(
        (gameId: string): GameActivity =>
            byGame[gameId] ?? { ...EMPTY, gameId },
        [byGame]
    )

    const totals = React.useMemo(() => {
        const items = Object.values(byGame)
        return {
            activePlayers: items.reduce((sum, i) => sum + i.activePlayers, 0),
            liveLobbies: items.reduce((sum, i) => sum + i.liveLobbies, 0),
            waitingLobbies: items.reduce((sum, i) => sum + i.waitingLobbies, 0),
            openPotMicro: items.reduce((sum, i) => sum + i.openPotMicro, 0),
        }
    }, [byGame])

    return { get, byGame, totals }
}
