"use client"

import { LexiWarsLobbyPanel, LexiWarsRoom } from "@/games/lexi-wars/room"
import { registerGame } from "@/games/registry"

registerGame({
    gameId: "lexi-wars",
    display: {
        accent: "oklch(0.812 0.152 79)",
        tagline: "Beat the rule, beat the clock, outlast the lobby.",
    },
    Room: LexiWarsRoom,
    LobbyPanel: LexiWarsLobbyPanel,
})
