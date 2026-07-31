"use client"

import type { GameModule } from "@/games/types"

/**
 * Client-side game registry keyed by backend `gameId`.
 *
 * Games register themselves from `games/{gameId}/index.ts`, which is imported
 * for side effects by `games/boot.ts`. Nothing here talks to the backend; the
 * registry only decides which React components render a given game.
 */
const modules = new Map<string, GameModule>()

export function registerGame(module: GameModule): void {
    if (modules.has(module.gameId)) {
        console.warn(`game "${module.gameId}" registered twice; keeping the first`)
        return
    }
    modules.set(module.gameId, module)
}

export function getGameModule(gameId: string): GameModule | undefined {
    return modules.get(gameId)
}

export function listGameModules(): GameModule[] {
    return Array.from(modules.values())
}

export function hasGameModule(gameId: string): boolean {
    return modules.has(gameId)
}
