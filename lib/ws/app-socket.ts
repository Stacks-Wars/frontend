import {
    isWsEnvelope,
    type ClientMessage,
    type WsEnvelope,
} from "./protocol"

export type ConnectionStatus = "idle" | "connecting" | "open" | "closed"

type MessageListener = (message: WsEnvelope) => void
type StatusListener = (status: ConnectionStatus) => void

const DEFAULT_WS_URL = "ws://127.0.0.1:8080/app"
const MIN_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 8_000

function resolveWsUrl(): string {
    return process.env.NEXT_PUBLIC_WS_URL?.trim() || DEFAULT_WS_URL
}

class AppSocket {
    private socket: WebSocket | null = null
    private status: ConnectionStatus = "idle"
    private intentionalClose = false
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private backoffMs = MIN_BACKOFF_MS
    private readonly messageListeners = new Set<MessageListener>()
    private readonly statusListeners = new Set<StatusListener>()

    getStatus(): ConnectionStatus {
        return this.status
    }

    onMessage(listener: MessageListener): () => void {
        this.messageListeners.add(listener)
        return () => {
            this.messageListeners.delete(listener)
        }
    }

    onStatus(listener: StatusListener): () => void {
        this.statusListeners.add(listener)
        listener(this.status)
        return () => {
            this.statusListeners.delete(listener)
        }
    }

    connect(): void {
        if (typeof window === "undefined") return
        this.intentionalClose = false

        if (
            this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)
        ) {
            return
        }

        this.clearReconnect()
        this.setStatus("connecting")

        const socket = new WebSocket(resolveWsUrl())
        this.socket = socket

        socket.onopen = () => {
            this.backoffMs = MIN_BACKOFF_MS
            this.setStatus("open")
        }

        socket.onmessage = (event) => {
            if (typeof event.data !== "string") return
            try {
                const parsed: unknown = JSON.parse(event.data)
                if (!isWsEnvelope(parsed)) return
                for (const listener of this.messageListeners) {
                    listener(parsed)
                }
            } catch {
                // Ignore malformed frames.
            }
        }

        socket.onerror = () => {
            // `onclose` handles reconnect; avoid console spam.
        }

        socket.onclose = () => {
            this.socket = null
            this.setStatus("closed")
            if (!this.intentionalClose) {
                this.scheduleReconnect()
            }
        }
    }

    disconnect(): void {
        this.intentionalClose = true
        this.clearReconnect()
        if (this.socket) {
            this.socket.close()
            this.socket = null
        }
        this.setStatus("closed")
    }

    send(message: ClientMessage | WsEnvelope): boolean {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return false
        }
        this.socket.send(JSON.stringify(message))
        return true
    }

    subscribe(topic: string): boolean {
        return this.send({ kind: "subscribe", payload: { topic } })
    }

    unsubscribe(topic: string): boolean {
        return this.send({ kind: "unsubscribe", payload: { topic } })
    }

    ping(): boolean {
        return this.send({ kind: "ping", payload: {} })
    }

    private setStatus(status: ConnectionStatus): void {
        this.status = status
        for (const listener of this.statusListeners) {
            listener(status)
        }
    }

    private scheduleReconnect(): void {
        this.clearReconnect()
        const delay = this.backoffMs
        this.backoffMs = Math.min(this.backoffMs * 2, MAX_BACKOFF_MS)
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null
            this.connect()
        }, delay)
    }

    private clearReconnect(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer)
            this.reconnectTimer = null
        }
    }
}

/** Singleton app WebSocket client — one multiplexed `/app` connection. */
export const appSocket = new AppSocket()
