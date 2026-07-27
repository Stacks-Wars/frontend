import type { GameCardProps } from "@/components/games/game-card"

export const GAMES: GameCardProps[] = [
    {
        name: "Checkers",
        slug: "checkers",
        blurb: "Classic board pressure. Outmaneuver, crown, and close.",
        image: "/games/checkers.png",
        accent: "from-[#2c61b8]/50",
    },
    {
        name: "Lexi Wars",
        slug: "lexi-wars",
        blurb: "Word combat under the clock. Spell your way up the ranks.",
        image: "/games/lexi-wars.svg",
        accent: "from-[#f29c11]/40",
    },
    {
        name: "Ludo",
        slug: "ludo",
        blurb: "Race, block, and send rivals home in high-stakes rounds.",
        image: "/games/ludo.png",
        accent: "from-emerald-500/35",
    },
    {
        name: "Ludo Rush",
        slug: "ludo-rush",
        blurb: "Faster lanes, sharper turns — same rivalry, less waiting.",
        image: "/games/ludo-rush.png",
        accent: "from-sky-500/35",
    },
]
