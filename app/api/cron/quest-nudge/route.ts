import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"
export const maxDuration = 60

function apiBase() {
    return (process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8080").replace(
        /\/$/,
        ""
    )
}

function cronAuthorized(request: Request): boolean {
    const secrets = [
        process.env.CRON_SECRET?.trim(),
        process.env.INTERNAL_API_SECRET?.trim(),
    ].filter((value): value is string => Boolean(value))
    if (secrets.length === 0) return false
    const header = request.headers.get("authorization")
    const bearer = header?.startsWith("Bearer ") ? header.slice(7) : null
    const internal = request.headers.get("x-internal-secret")
    return Boolean(
        (bearer && secrets.includes(bearer)) ||
            (internal && secrets.includes(internal))
    )
}

/**
 * 10:00 UTC daily quest reminder. Rust claims send slots and fans out
 * Web Push + WS; this route only kicks it.
 */
export async function GET(request: Request) {
    if (!cronAuthorized(request)) {
        return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const secret = process.env.INTERNAL_API_SECRET?.trim()
    if (!secret) {
        return NextResponse.json(
            { error: "INTERNAL_API_SECRET is not configured" },
            { status: 500 }
        )
    }

    const response = await fetch(`${apiBase()}/admin/quests/daily-nudge`, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "x-internal-secret": secret,
        },
        cache: "no-store",
    })
    const body = await response.text().catch(() => "")
    if (!response.ok) {
        return NextResponse.json(
            { error: `daily-nudge failed (${response.status}): ${body}` },
            { status: 502 }
        )
    }

    try {
        return NextResponse.json(JSON.parse(body) as unknown)
    } catch {
        return NextResponse.json({ ok: true })
    }
}

export async function POST(request: Request) {
    return GET(request)
}
