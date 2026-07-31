"use client"

import { CheckersLobbyPanel, CheckersRoom } from "@/games/checkers/room"
import { registerGame } from "@/games/registry"

registerGame({
    gameId: "checkers",
    display: {
        accent: "oklch(0.672 0.183 259)",
        tagline: "Two players, forced captures, one board.",
    },
    Room: CheckersRoom,
    LobbyPanel: CheckersLobbyPanel,
})
