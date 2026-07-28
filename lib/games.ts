/** Static visuals keyed by game slug (API metadata has no images). */
export const GAME_VISUALS: Record<string, { image: string; accent?: string }> =
    {
        checkers: {
            image: "/games/checkers.png",
            accent: "from-[#2c61b8]/50",
        },
        "lexi-wars": {
            image: "/games/lexi-wars.svg",
            accent: "from-[#f29c11]/40",
        },
        ludo: {
            image: "/games/ludo.png",
            accent: "from-emerald-500/35",
        },
        "ludo-rush": {
            image: "/games/ludo-rush.png",
            accent: "from-sky-500/35",
        },
    }

export function gameVisual(slug: string) {
    return (
        GAME_VISUALS[slug] ?? {
            image: "/games/checkers.png",
            accent: "from-primary/40",
        }
    )
}
