"use client"

import { LudoLobbyPanel, LudoRoom } from "@/games/ludo/room"
import { registerGame } from "@/games/registry"

/** Ludo Rush shares the Ludo protocol, so it reuses the same room component. */
registerGame({
    gameId: "ludo-rush",
    display: {
        accent: "oklch(0.688 0.232 12)",
        tagline: "Ludo with the brakes off.",
    },
    Room: LudoRoom,
    LobbyPanel: () => LudoLobbyPanel({ rush: true }),
})
