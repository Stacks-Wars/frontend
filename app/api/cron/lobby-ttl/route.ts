import { NextResponse } from "next/server"

import { vaultKickAsPlatform } from "@/lib/vault/submit"
import { vaultConfigured } from "@/lib/vault/config"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type StaleSeat = {
    userId: string
    stxAddress: string
    paidMicro: number
    isCreator: boolean
}

type StaleLobby = {
    lobby: {
        id: string
        path: string
        entryAmountMicro: number
    }
    seats: StaleSeat[]
}

function apiBase() {
    return (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080").replace(
        /\/$/,
        ""
    )
}

function cronAuthorized(request: Request): boolean {
    const secret = process.env.INTERNAL_API_SECRET?.trim()
    if (!secret) return false
    const header = request.headers.get("authorization")
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null
    const internal = request.headers.get("x-internal-secret")
    return bearer === secret || internal === secret
}

async function internalFetch(path: string, init?: RequestInit) {
    const secret = process.env.INTERNAL_API_SECRET?.trim()
    if (!secret) {
        throw new Error("INTERNAL_API_SECRET is not configured")
    }
    const response = await fetch(`${apiBase()}${path}`, {
        ...init,
        headers: {
            "content-type": "application/json",
            "x-internal-secret": secret,
            ...(init?.headers ?? {}),
        },
        cache: "no-store",
    })
    if (!response.ok) {
        const body = await response.text().catch(() => "")
        throw new Error(`${path} failed (${response.status}): ${body}`)
    }
    return response.json()
}

/**
 * Refund + expire waiting lobbies older than 24h.
 * Free lobbies are also purged by the Rust janitor; this route handles paid seats.
 */
export async function GET(request: Request) {
    if (!cronAuthorized(request)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const stale = (await internalFetch("/admin/lobbies/stale")) as StaleLobby[]
    const results: Array<{
        lobbyId: string
        path: string
        ok: boolean
        error?: string
    }> = []

    for (const item of stale) {
        try {
            // Every on-chain seat needs a kick (including sponsored guests with paid=0).
            for (const seat of item.seats) {
                let vaultTxid: string | undefined
                if (item.lobby.entryAmountMicro > 0) {
                    if (!vaultConfigured()) {
                        throw new Error(
                            "vault not configured; cannot refund paid lobby"
                        )
                    }
                    vaultTxid = await vaultKickAsPlatform({
                        targetAddress: seat.stxAddress,
                        lobbyPath: item.lobby.path,
                        paidMicro: seat.paidMicro,
                        nonce: Date.now() + Math.floor(Math.random() * 1000),
                    })
                }
                await internalFetch(
                    `/admin/lobbies/${item.lobby.id}/expire-seat`,
                    {
                        method: "POST",
                        body: JSON.stringify({
                            userId: seat.userId,
                            stxAddress: seat.stxAddress,
                            vaultTxid: vaultTxid ?? null,
                        }),
                    }
                )
            }

            await internalFetch(`/admin/lobbies/${item.lobby.id}/expire`, {
                method: "POST",
                body: "{}",
            })
            results.push({
                lobbyId: item.lobby.id,
                path: item.lobby.path,
                ok: true,
            })
        } catch (error) {
            results.push({
                lobbyId: item.lobby.id,
                path: item.lobby.path,
                ok: false,
                error: error instanceof Error ? error.message : "expire failed",
            })
        }
    }

    return NextResponse.json({
        scanned: stale.length,
        expired: results.filter((r) => r.ok).length,
        results,
    })
}

export async function POST(request: Request) {
    return GET(request)
}
