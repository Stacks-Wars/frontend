import type { HostedLobbyRef } from "@/lib/api/types"

export type ActionResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; code?: string; lobbies?: HostedLobbyRef[] }

export class TooManyLobbiesError extends Error {
    code = "too_many_lobbies" as const
    lobbies: HostedLobbyRef[]

    constructor(lobbies: HostedLobbyRef[]) {
        super("Settle your open lobbies before hosting another.")
        this.lobbies = lobbies
    }
}

const PREFIXES = ["bad request: ", "conflict: ", "forbidden: ", "not found: "]

/**
 * Server actions mask thrown errors in production, so failures travel back as
 * data instead. Backend errors arrive prefixed with their status class, which
 * is noise for a toast.
 */
export async function actionResult<T>(
    task: () => Promise<T>
): Promise<ActionResult<T>> {
    try {
        return { ok: true, data: await task() }
    } catch (error) {
        if (error instanceof TooManyLobbiesError) {
            return {
                ok: false,
                error: error.message,
                code: error.code,
                lobbies: error.lobbies,
            }
        }
        const raw =
            error instanceof Error ? error.message : "Something went wrong"
        const prefix = PREFIXES.find((candidate) =>
            raw.toLowerCase().startsWith(candidate)
        )
        const message = prefix ? raw.slice(prefix.length) : raw
        console.error("[action]", raw)
        return {
            ok: false,
            error: message.charAt(0).toUpperCase() + message.slice(1),
        }
    }
}
