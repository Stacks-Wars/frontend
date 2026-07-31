/** Wire shapes for `sw-lexi-wars`. Mirrors `lexi-wars/src/message.rs`. */

export type EnginePlayer = {
    userId: string
    username: string | null
    displayName: string | null
}

export type ClientRule = {
    name: string
    description: string
}

export type LexiWarsEvent =
    | { type: "usedWord"; word: string }
    | { type: "wordEntry"; word: string; player: EnginePlayer }
    | { type: "invalid"; reason: string }
    | { type: "playersCount"; remaining: number; total: number }
    | { type: "turn"; player: EnginePlayer; timeoutSecs: number }
    | { type: "rule"; rule: ClientRule | null }
    | { type: "eliminated"; player: EnginePlayer; reason: string }
    | { type: "countdown"; time: number }

export type LexiWarsSnapshot = {
    playersCount: { remaining: number; total: number } | null
    turn: { player: EnginePlayer; timeoutSecs: number } | null
    rule: { rule: ClientRule | null } | null
    countdown: { time: number } | null
}
