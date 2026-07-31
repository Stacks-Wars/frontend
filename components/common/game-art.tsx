import { cn } from "@/lib/utils"

/**
 * Placeholder cover art.
 *
 * We have no game artwork yet, so each game gets a deterministic generated
 * cover: two hue-rotated washes plus a diagonal weave, seeded from the game id
 * so a game always looks the same everywhere it appears.
 */

type Aspect = "cover" | "square" | "banner"

const ASPECT: Record<Aspect, string> = {
    cover: "aspect-[16/10]",
    square: "aspect-square",
    banner: "aspect-[21/9]",
}

function hue(seed: string): number {
    let hash = 0
    for (let i = 0; i < seed.length; i += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(i)
        hash |= 0
    }
    return Math.abs(hash) % 360
}

function glyph(name: string): string {
    const words = name.trim().split(/[\s_-]+/).filter(Boolean)
    if (words.length === 0) return "?"
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
    return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export function GameArt({
    gameId,
    name,
    aspect = "cover",
    className,
    children,
}: {
    gameId: string
    name: string
    aspect?: Aspect
    className?: string
    children?: React.ReactNode
}) {
    const base = hue(gameId)
    const secondary = (base + 58) % 360

    return (
        <div
            className={cn(
                "relative isolate overflow-hidden rounded-xl",
                ASPECT[aspect],
                className
            )}
            style={{
                background: `radial-gradient(120% 100% at 15% 0%, oklch(0.55 0.19 ${base} / 0.75), transparent 62%),
                    radial-gradient(110% 110% at 100% 100%, oklch(0.5 0.17 ${secondary} / 0.6), transparent 58%),
                    oklch(0.19 0.02 264)`,
            }}
        >
            <div
                aria-hidden
                className="absolute inset-0 opacity-[0.18]"
                style={{
                    backgroundImage:
                        "repeating-linear-gradient(135deg, oklch(1 0 0 / 0.5) 0 1px, transparent 1px 14px)",
                }}
            />
            <span
                aria-hidden
                className="absolute inset-0 flex items-center justify-center font-display text-[clamp(2rem,22cqw,4.5rem)] leading-none text-white/12"
                style={{ containerType: "inline-size" }}
            >
                {glyph(name)}
            </span>
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/10 to-transparent" />
            {children}
        </div>
    )
}

/** Accent color for a game, matching the generated art. */
export function gameHue(gameId: string): string {
    return `oklch(0.68 0.18 ${hue(gameId)})`
}
