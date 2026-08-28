import { NextResponse } from "next/server"

import {
    claimPendingWinAction,
    createLobbyAction,
    joinLobbyAction,
    kickLobbyPlayerAction,
    leaveLobbyAction,
    refundDrawSeatsAction,
    settleVaultClaimsAction,
} from "@/actions/lobbies"
import { withdrawAction } from "@/actions/wallet"
import { claimSolanaTestUsdc } from "@/actions/chain"
import { actionResult } from "@/lib/action-result"

/**
 * Dedicated Vercel Function for vault / withdraw waits on Hiro.
 * Other app routes keep the project default (10s).
 */
export const runtime = "nodejs"
export const maxDuration = 60

const OPS = new Set([
    "create",
    "join",
    "leave",
    "kick",
    "claim",
    "claim-pending",
    "draw-refund",
    "withdraw",
    "claim-usdc",
])

function sameOrigin(request: Request): boolean {
    const origin = request.headers.get("origin")
    if (!origin) return true
    return origin === new URL(request.url).origin
}

export async function POST(
    request: Request,
    context: { params: Promise<{ op: string }> }
) {
    if (!sameOrigin(request)) {
        return NextResponse.json(
            { ok: false, error: "Forbidden." },
            { status: 403 }
        )
    }

    const { op } = await context.params
    if (!OPS.has(op)) {
        return NextResponse.json(
            { ok: false, error: "Unknown operation." },
            { status: 404 }
        )
    }

    const body = (await request.json().catch(() => null)) as Record<
        string,
        unknown
    > | null
    if (!body) {
        return NextResponse.json(
            { ok: false, error: "Invalid body." },
            { status: 400 }
        )
    }

    switch (op) {
        case "create":
            return NextResponse.json(await createLobbyAction(body as never))
        case "join":
            return NextResponse.json(
                await joinLobbyAction(String(body.lobbyId ?? ""))
            )
        case "leave":
            return NextResponse.json(
                await leaveLobbyAction(String(body.lobbyId ?? ""))
            )
        case "kick":
            return NextResponse.json(
                await kickLobbyPlayerAction(
                    String(body.lobbyId ?? ""),
                    String(body.targetUserId ?? "")
                )
            )
        case "claim":
            return NextResponse.json(
                await settleVaultClaimsAction(body as never)
            )
        case "draw-refund":
            return NextResponse.json(
                await refundDrawSeatsAction(body as never)
            )
        case "claim-pending":
            return NextResponse.json(
                await claimPendingWinAction(String(body.lobbyPath ?? ""))
            )
        case "withdraw":
            return NextResponse.json(
                await actionResult(() =>
                    withdrawAction({
                        amountUsd: Number(body.amountUsd),
                        toAddress:
                            typeof body.toAddress === "string"
                                ? body.toAddress
                                : "",
                    })
                )
            )
        case "claim-usdc":
            return NextResponse.json(
                await actionResult(() => claimSolanaTestUsdc())
            )
        default:
            return NextResponse.json(
                { ok: false, error: "Unknown operation." },
                { status: 404 }
            )
    }
}
