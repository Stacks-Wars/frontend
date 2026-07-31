/** Presentation helpers. Every amount on the wire is micro-USDCx. */

export const MICRO = 1_000_000

export function toUsdc(micro: number): number {
    return micro / MICRO
}

export function toMicro(usdc: number): number {
    return Math.round(usdc * MICRO)
}

/** `$12.50`, or `Free` for zero when `zero` is left at its default. */
export function formatUsdc(
    micro: number,
    options: { zero?: string; sign?: boolean; maximumFractionDigits?: number } = {}
): string {
    const { zero = "Free", sign = false, maximumFractionDigits = 2 } = options
    if (micro === 0 && zero) return zero

    const value = toUsdc(Math.abs(micro))
    const body = value.toLocaleString("en-US", {
        minimumFractionDigits: value < 100 ? 2 : 0,
        maximumFractionDigits,
    })
    const prefix = micro < 0 ? "-" : sign ? "+" : ""
    return `${prefix}$${body}`
}

/** `1.2K`, `18.4M` — for player counts and pot totals in tight spaces. */
export function compact(value: number): string {
    return Intl.NumberFormat("en-US", {
        notation: "compact",
        maximumFractionDigits: 1,
    }).format(value)
}

export function formatPercent(bps: number): string {
    return `${(bps / 100).toFixed(bps % 100 === 0 ? 0 : 1)}%`
}

const RELATIVE = new Intl.RelativeTimeFormat("en", { numeric: "auto" })

const UNITS: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ["year", 31_536_000_000],
    ["month", 2_592_000_000],
    ["week", 604_800_000],
    ["day", 86_400_000],
    ["hour", 3_600_000],
    ["minute", 60_000],
    ["second", 1_000],
]

/** `just now`, `4 minutes ago`, `in 2 days`. Accepts ms, seconds, or ISO. */
export function timeAgo(input: number | string | Date | null | undefined): string {
    if (input == null) return "—"
    const ms = toMillis(input)
    if (ms == null) return "—"

    const diff = ms - Date.now()
    const abs = Math.abs(diff)
    if (abs < 45_000) return "just now"

    for (const [unit, size] of UNITS) {
        if (abs >= size) {
            return RELATIVE.format(Math.round(diff / size), unit)
        }
    }
    return "just now"
}

export function formatDate(input: number | string | Date): string {
    const ms = toMillis(input)
    if (ms == null) return "—"
    return new Date(ms).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    })
}

/** `2:05` from seconds — used by turn timers. */
export function formatClock(totalSeconds: number): string {
    const safe = Math.max(0, Math.floor(totalSeconds))
    const minutes = Math.floor(safe / 60)
    const seconds = safe % 60
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

function toMillis(input: number | string | Date): number | null {
    if (input instanceof Date) return input.getTime()
    if (typeof input === "number") {
        // Engine timestamps are seconds; API timestamps are ISO strings.
        return input < 1e12 ? input * 1000 : input
    }
    const parsed = Date.parse(input)
    return Number.isNaN(parsed) ? null : parsed
}

export function initials(name: string | null | undefined, fallback = "??"): string {
    const source = name?.trim()
    if (!source) return fallback
    const parts = source.split(/[\s_-]+/).filter(Boolean)
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

/** Best display name for a user, preferring handle over legal name. */
export function displayNameFor(user: {
    username?: string | null
    displayName?: string | null
    userId?: string
    id?: string
}): string {
    return (
        user.username ??
        user.displayName ??
        `Player ${(user.userId ?? user.id ?? "").slice(0, 4)}`
    )
}

export function shortId(value: string, size = 4): string {
    return value.length <= size * 2 ? value : `${value.slice(0, size)}…${value.slice(-size)}`
}

export function ordinal(rank: number): string {
    const mod100 = rank % 100
    if (mod100 >= 11 && mod100 <= 13) return `${rank}th`
    switch (rank % 10) {
        case 1:
            return `${rank}st`
        case 2:
            return `${rank}nd`
        case 3:
            return `${rank}rd`
        default:
            return `${rank}th`
    }
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
    return `${count} ${count === 1 ? singular : plural}`
}

/** Backend ids like `wordGames` or `board_games` become "Word games". */
export function label(value: string): string {
    const words = value
        .replace(/[_-]+/g, " ")
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .toLowerCase()
        .trim()
    return words.charAt(0).toUpperCase() + words.slice(1)
}
