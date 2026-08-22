export type TxUiStatus =
    "idle" | "initiating" | "pending" | "confirmed" | "failed"

export type WaitForTxResult = {
    status: "confirmed" | "failed" | "pending"
    reason?: string
}

export type PeekTxResult =
    | { status: "pending" }
    | { status: "confirmed" }
    | { status: "failed"; reason?: string }
    | { status: "unknown" }

type WaitOptions = {
    signal?: AbortSignal
    /** Optional reason substrings treated as success (SIP-010 races). */
    expectedReasonAllowlist?: string[]
    pollIntervalMs?: number
    /**
     * Stop polling and return `pending`. Default sits under the 60s
     * `/api/onchain` and lobby-ttl functions.
     */
    maxWaitMs?: number
}

function hiroBaseUrl(): string {
    const network =
        process.env.NEXT_PUBLIC_STACKS_NETWORK?.trim() ||
        process.env.NEXT_PUBLIC_NETWORK?.trim() ||
        "testnet"
    const custom = process.env.NEXT_PUBLIC_HIRO_API_URL?.trim()
    if (custom) return custom.replace(/\/$/, "")
    return `https://api.${network}.hiro.so`
}

function hiroHeaders(): HeadersInit {
    const key = process.env.HIRO_API_KEY?.trim()
    return key ? { "x-api-key": key } : {}
}

function isAbort(signal?: AbortSignal) {
    return Boolean(signal?.aborted)
}

function reasonAllowed(
    reason: string | undefined,
    allowlist?: string[]
): boolean {
    if (!reason || !allowlist?.length) return false
    return allowlist.some((a) => reason.includes(a))
}

/** One-shot Hiro lookup — used to drop failed drafts before rebroadcast. */
export async function peekTx(txId: string): Promise<PeekTxResult> {
    try {
        const res = await fetch(`${hiroBaseUrl()}/extended/v1/tx/${txId}`, {
            headers: hiroHeaders(),
            cache: "no-store",
        })
        if (res.status === 404) return { status: "pending" }
        if (!res.ok) return { status: "unknown" }
        const data = (await res.json()) as {
            tx_status?: string
            tx_result?: { repr?: string }
        }
        const txStatus = data.tx_status ?? ""
        if (txStatus === "success") return { status: "confirmed" }
        if (
            txStatus === "abort_by_response" ||
            txStatus === "abort_by_post_condition"
        ) {
            return {
                status: "failed",
                reason: data.tx_result?.repr ?? txStatus,
            }
        }
        if (txStatus.startsWith("dropped_") || txStatus === "rejected") {
            return {
                status: "failed",
                reason: data.tx_result?.repr ?? txStatus,
            }
        }
        return { status: "pending" }
    } catch {
        return { status: "unknown" }
    }
}

/**
 * Wait for a Stacks tx to confirm via Hiro WS + HTTP poll fallback.
 */
export async function waitForTx(
    txId: string,
    options: WaitOptions = {}
): Promise<WaitForTxResult> {
    const {
        signal,
        expectedReasonAllowlist,
        pollIntervalMs = 5_000,
        maxWaitMs = 50_000,
    } = options

    let settled = false
    let resolveFn: (r: WaitForTxResult) => void = () => {}
    let rejectFn: (e: unknown) => void = () => {}

    const result = new Promise<WaitForTxResult>((resolve, reject) => {
        resolveFn = resolve
        rejectFn = reject
    })

    const finish = (r: WaitForTxResult) => {
        if (settled) return
        settled = true
        resolveFn(r)
    }

    const fail = (err: unknown) => {
        if (settled) return
        settled = true
        rejectFn(err)
    }

    const onAbort = () => fail(new DOMException("Aborted", "AbortError"))
    signal?.addEventListener("abort", onAbort)

    const deadline =
        maxWaitMs > 0
            ? setTimeout(() => finish({ status: "pending" }), maxWaitMs)
            : undefined

    const evaluate = (txStatus: string, reason?: string): boolean => {
        if (txStatus === "success") {
            finish({ status: "confirmed" })
            return true
        }
        if (
            txStatus === "abort_by_response" ||
            txStatus === "abort_by_post_condition"
        ) {
            if (reasonAllowed(reason, expectedReasonAllowlist)) {
                finish({ status: "confirmed", reason })
                return true
            }
            finish({ status: "failed", reason: reason ?? "aborted" })
            return true
        }
        return false
    }

    let ws: WebSocket | null = null
    try {
        const base = hiroBaseUrl().replace(/^http/, "ws")
        ws = new WebSocket(`${base}/`)
        ws.onopen = () => {
            ws?.send(
                JSON.stringify({
                    method: "subscribe",
                    params: [`tx_updates:${txId}`],
                    id: 1,
                    jsonrpc: "2.0",
                })
            )
        }
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(String(event.data)) as {
                    params?: {
                        tx_status?: string
                        tx_result?: { repr?: string }
                    }
                    tx_status?: string
                    tx_result?: { repr?: string }
                }
                const status = data.params?.tx_status ?? data.tx_status ?? ""
                const reason =
                    data.params?.tx_result?.repr ?? data.tx_result?.repr
                if (status) evaluate(status, reason)
            } catch {
                // ignore
            }
        }
    } catch {
        // WS optional
    }

    const poll = async () => {
        while (!settled && !isAbort(signal)) {
            try {
                const res = await fetch(
                    `${hiroBaseUrl()}/extended/v1/tx/${txId}`,
                    { signal, headers: hiroHeaders() }
                )
                if (res.ok) {
                    const data = (await res.json()) as {
                        tx_status?: string
                        tx_result?: { repr?: string }
                    }
                    if (
                        data.tx_status &&
                        evaluate(data.tx_status, data.tx_result?.repr)
                    ) {
                        break
                    }
                }
            } catch (err) {
                if (isAbort(signal)) break
                if (err instanceof DOMException && err.name === "AbortError") {
                    break
                }
            }
            await new Promise((r) => setTimeout(r, pollIntervalMs))
        }
    }

    void poll()

    try {
        return await result
    } finally {
        if (deadline !== undefined) clearTimeout(deadline)
        signal?.removeEventListener("abort", onAbort)
        try {
            ws?.close()
        } catch {
            // ignore
        }
    }
}
