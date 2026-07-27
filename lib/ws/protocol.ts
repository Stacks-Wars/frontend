/** Shared app WebSocket envelope — mirrors backend `ws::protocol`. */

export const APP_TOPIC = "app"

export type WsEnvelope = {
    kind: string
    payload: Record<string, unknown>
}

export type ClientMessage =
    | { kind: "subscribe"; payload: { topic: string } }
    | { kind: "unsubscribe"; payload: { topic: string } }
    | { kind: "ping"; payload: Record<string, never> }

export type ServerMessageKind =
    "connected" | "subscribed" | "unsubscribed" | "pong" | "error"

export function isWsEnvelope(value: unknown): value is WsEnvelope {
    if (!value || typeof value !== "object") return false
    const record = value as Record<string, unknown>
    return (
        typeof record.kind === "string" &&
        typeof record.payload === "object" &&
        record.payload !== null
    )
}
