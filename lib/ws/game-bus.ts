"use client"

import type { GameEvent } from "@/lib/ws/protocol"

type Listener = (event: GameEvent) => void

/**
 * Fan-out for engine events, keyed by lobby.
 *
 * Game components subscribe here rather than to the socket directly, so a game
 * only ever sees its own lobby's events and the provider stays the single
 * place that parses the wire format.
 */
const listeners = new Map<string, Set<Listener>>()

export function subscribeToGameEvents(
    lobbyId: string,
    listener: Listener
): () => void {
    let set = listeners.get(lobbyId)
    if (!set) {
        set = new Set()
        listeners.set(lobbyId, set)
    }
    set.add(listener)

    return () => {
        const current = listeners.get(lobbyId)
        if (!current) return
        current.delete(listener)
        if (current.size === 0) listeners.delete(lobbyId)
    }
}

export function emitGameEvent(lobbyId: string, event: GameEvent): void {
    const set = listeners.get(lobbyId)
    if (!set) return
    for (const listener of set) {
        try {
            listener(event)
        } catch (error) {
            console.error("game event listener failed", error)
        }
    }
}
