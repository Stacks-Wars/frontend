/**
 * Games with a registered UI module.
 *
 * The registry itself is client-only, so server components read this list to
 * decide whether to show a "Playable" badge. Keep it in sync with the imports
 * in `games/boot.ts`.
 */
export const PLAYABLE_GAME_IDS = new Set([
    "checkers",
    "lexi-wars",
    "ludo",
    "ludo-rush",
])

export function isPlayable(gameId: string): boolean {
    return PLAYABLE_GAME_IDS.has(gameId)
}
