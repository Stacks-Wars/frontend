import {
    isWsEnvelope,
    type ClientMessage,
    type WsEnvelope,
} from "./protocol"

export type ConnectionStatus = "idle" | "connecting" | "open" | "closed"

type MessageListener = (message: WsEnvelope) => void
type StatusListener = (status: ConnectionStatus) => void
type TokenProvider = () => Promise<string | null>

const DEFAULT_WS_URL = "ws://127.0.0.1:8080/app"
const MIN_BACKOFF_MS = 1_000
const MAX_BACKOFF_MS = 8_000
const HEARTBEAT_MS = 25_000
/** Auth retries per connection, and the gap between them. */
const MAX_AUTH_ATTEMPTS = 3
const AUTH_RETRY_MS = 15_000

function resolveWsUrl(): string {
    return process.env.NEXT_PUBLIC_WS_URL?.trim() || DEFAULT_WS_URL
}

function isPrivateTopic(topic: string): boolean {
    return topic.startsWith("user:")
}

/**
 * One multiplexed `/app` connection shared by the whole client.
 *
 * Topics are reference counted and re-sent on every (re)connect, so a dropped
 * socket transparently restores every room, feed, and private channel the UI
 * had open. Private `user:` topics wait for the auth ack before subscribing.
 */
class AppSocket {
    private socket: WebSocket | null = null
    private status: ConnectionStatus = "idle"
    private intentionalClose = false
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null
    private heartbeatTimer: ReturnType<typeof setInterval> | null = null
    private backoffMs = MIN_BACKOFF_MS
    private tokenProvider: TokenProvider | null = null
    private authenticated = false
    private authAttempts = 0
    private authInFlight = false
    private lastAuthAt = 0
    private readonly messageListeners = new Set<MessageListener>()
    private readonly statusListeners = new Set<StatusListener>()
    /** topic → number of live subscribers in the React tree */
    private readonly topicRefs = new Map<string, number>()
    /** topics confirmed on the current socket */
    private readonly activeTopics = new Set<string>()

    setTokenProvider(provider: TokenProvider | null) {
        this.tokenProvider = provider
    }

    getStatus(): ConnectionStatus {
        return this.status
    }

    isAuthenticated(): boolean {
        return this.authenticated
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
        this.resetAuth()
        this.activeTopics.clear()
        this.setStatus("connecting")

        const socket = new WebSocket(resolveWsUrl())
        this.socket = socket

        // A replaced socket can still emit; its events must not touch the
        // state of the connection that superseded it.
        const isCurrent = () => this.socket === socket

        socket.onopen = () => {
            if (!isCurrent()) return
            this.backoffMs = MIN_BACKOFF_MS
            this.setStatus("open")
            this.startHeartbeat()
            this.flushTopics()
            void this.authenticate()
        }

        socket.onmessage = (event) => {
            if (!isCurrent()) return
            if (typeof event.data !== "string") return
            let parsed: unknown
            try {
                parsed = JSON.parse(event.data)
            } catch {
                return
            }
            if (!isWsEnvelope(parsed)) return

            if (parsed.kind === "authenticated") {
                this.authenticated = true
                this.authAttempts = 0
                // Private topics were held back until now.
                this.flushTopics()
            }
            if (
                parsed.kind === "error" &&
                parsed.payload.code === "unauthorized"
            ) {
                this.authenticated = false
                // Rate limited on purpose: the server rejecting a token must
                // never turn into a hot loop of token mints.
                if (Date.now() - this.lastAuthAt >= AUTH_RETRY_MS) {
                    void this.authenticate()
                }
            }

            for (const listener of this.messageListeners) {
                listener(parsed)
            }
        }

        socket.onerror = () => {
            // `onclose` handles reconnect; avoid console spam.
        }

        socket.onclose = () => {
            if (!isCurrent()) return
            this.socket = null
            this.authenticated = false
            this.activeTopics.clear()
            this.stopHeartbeat()
            this.setStatus("closed")
            if (!this.intentionalClose) {
                this.scheduleReconnect()
            }
        }
    }

    disconnect(): void {
        this.intentionalClose = true
        this.clearReconnect()
        this.stopHeartbeat()
        if (this.socket) {
            this.socket.close()
            this.socket = null
        }
        this.authenticated = false
        this.activeTopics.clear()
        this.setStatus("closed")
    }

    send(message: ClientMessage | WsEnvelope): boolean {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            return false
        }
        this.socket.send(JSON.stringify(message))
        return true
    }

    /**
     * Register interest in a topic. Returns a release function; the topic is
     * only unsubscribed once every caller has released it.
     */
    acquireTopic(topic: string): () => void {
        this.topicRefs.set(topic, (this.topicRefs.get(topic) ?? 0) + 1)
        this.flushTopics()

        let released = false
        return () => {
            if (released) return
            released = true
            const next = (this.topicRefs.get(topic) ?? 1) - 1
            if (next > 0) {
                this.topicRefs.set(topic, next)
                return
            }
            this.topicRefs.delete(topic)
            if (this.activeTopics.delete(topic)) {
                this.send({ kind: "unsubscribe", payload: { topic } })
            }
        }
    }

    /** Ask the server to re-send a room snapshot (used after a reconnect). */
    requestLobbySync(lobbyId: string): boolean {
        return this.send({ kind: "lobby.sync", payload: { lobbyId } })
    }

    sendGameAction(lobbyId: string, gameId: string, action: unknown): boolean {
        return this.send({
            kind: "game.action",
            payload: { lobbyId, gameId, action },
        })
    }

    sendGameQuit(lobbyId: string): boolean {
        return this.send({ kind: "game.quit", payload: { lobbyId } })
    }

    sendChat(lobbyId: string, body: string): boolean {
        return this.send({ kind: "chat.send", payload: { lobbyId, body } })
    }

    ping(): boolean {
        return this.send({ kind: "ping", payload: {} })
    }

    /** Subscribe to everything wanted that isn't already active. */
    private flushTopics(): void {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return

        for (const topic of this.topicRefs.keys()) {
            if (this.activeTopics.has(topic)) continue
            if (isPrivateTopic(topic) && !this.authenticated) continue
            if (this.send({ kind: "subscribe", payload: { topic } })) {
                this.activeTopics.add(topic)
            }
        }
    }

    /** Re-authenticate after a sign-in without waiting for a reconnect. */
    refreshAuth(): void {
        this.resetAuth()
        void this.authenticate()
    }

    private resetAuth(): void {
        this.authenticated = false
        this.authAttempts = 0
        this.lastAuthAt = 0
    }

    private async authenticate(): Promise<void> {
        if (!this.tokenProvider) return
        if (this.authInFlight) return
        if (this.authAttempts >= MAX_AUTH_ATTEMPTS) return

        this.authInFlight = true
        this.authAttempts += 1
        this.lastAuthAt = Date.now()
        try {
            const token = await this.tokenProvider()
            if (!token) return
            this.send({ kind: "auth", payload: { token } })
        } catch {
            // Session may not be ready yet.
        } finally {
            this.authInFlight = false
        }
    }

    private setStatus(status: ConnectionStatus): void {
        if (this.status === status) return
        this.status = status
        for (const listener of this.statusListeners) {
            listener(status)
        }
    }

    private startHeartbeat(): void {
        this.stopHeartbeat()
        this.heartbeatTimer = setInterval(() => this.ping(), HEARTBEAT_MS)
    }

    private stopHeartbeat(): void {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = null
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
