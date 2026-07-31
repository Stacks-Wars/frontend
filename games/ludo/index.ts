"use client"

import { LudoLobbyPanel, LudoRoom } from "@/games/ludo/room"
import { registerGame } from "@/games/registry"

registerGame({
    gameId: "ludo",
    display: {
        accent: "oklch(0.723 0.168 156)",
        tagline: "Two dice, four pawns, no mercy.",
    },
    Room: LudoRoom,
    LobbyPanel: () => LudoLobbyPanel({}),
})
