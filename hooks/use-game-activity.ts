"use client"

import * as React from "react"

import { listGameActivityAction } from "@/actions/games"
import type { GameActivity } from "@/lib/api/types"
import { useLiveActions, useLiveStore } from "@/stores/live"

const EMPTY: GameActivity = {
    gameId: "",
    waitingLobbies: 0,
    liveLobbies: 0,
    activePlayers: 0,
    openPotMicro: 0,
}

let seedInFlight: Promise<void> | null = null

function seedActivityFromHttp() {
    if (Object.keys(useLiveStore.getState().activity).length > 0) return
    if (seedInFlight) return seedInFlight
    seedInFlight = listGameActivityAction()
        .then((items) => {
            if (Object.keys(useLiveStore.getState().activity).length > 0) return
            useLiveStore.getState().actions.setActivity(items)
        })
        .catch(() => undefined)
        .finally(() => {
            seedInFlight = null
        })
    return seedInFlight
}

/**
 * Per-game live counters, seeded from the server render (or one HTTP call)
 * then updated by `games.activity` broadcasts.
 */
export function useGameActivity(initial: GameActivity[] = []) {
    const activity = useLiveStore((s) => s.activity)
    const { setActivity } = useLiveActions()

    React.useEffect(() => {
        if (Object.keys(useLiveStore.getState().activity).length > 0) return
        if (initial.length > 0) {
            setActivity(initial)
            return
        }
        void seedActivityFromHttp()
    }, [activity, initial, setActivity])

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
