import type { ReactNode } from "react"

import type {
    GameActivity,
    GameMetadata,
    Lobby,
    LobbyDetail,
    PlayerState,
} from "@/lib/api/types"
import type { ConnectionStatus } from "@/lib/ws/app-socket"
import type { GameChannel } from "@/hooks/use-lobby-room"

export type { GameChannel }

/* ------------------------------------------------------------------ */
/* Room                                                                */
/* ------------------------------------------------------------------ */

/** Props handed to a game's in-match component once the lobby is playing. */
export type GameRoomProps = {
    lobby: Lobby
    players: PlayerState[]
    selfUserId: string | null
    /** Engine state from the room snapshot; `null` before the first sync. */
    initialState: unknown
    channel: GameChannel
    connection: ConnectionStatus
}

/** Optional panel rendered beside the waiting room, before the match starts. */
export type GameLobbyPanelProps = {
    lobby: Lobby
    players: PlayerState[]
    selfUserId: string | null
}

/* ------------------------------------------------------------------ */
/* Game detail page                                                    */
/* ------------------------------------------------------------------ */

/**
 * Reusable sections of the default `/games/:gameId` page.
 *
 * A game that registers its own `Page` can compose these to extend the default
 * layout instead of rebuilding it, or ignore them to replace it entirely.
 */
export type DefaultGameSections = {
    Hero: () => ReactNode
    Stats: () => ReactNode
    Lobbies: () => ReactNode
    Activity: () => ReactNode
    HowItWorks: () => ReactNode
    /** The whole default page, for games that only want to append sections. */
    Default: () => ReactNode
}

export type GamePageProps = {
    game: GameMetadata
    activity: GameActivity
    lobbies: Lobby[]
    recentFinished: Lobby[]
    sections: DefaultGameSections
}

/* ------------------------------------------------------------------ */
/* Module                                                              */
/* ------------------------------------------------------------------ */

export type GameDisplay = {
    /** CSS color used for accents on cards and the game page. */
    accent?: string
    /** Path under `public/` for cover art. */
    art?: string
    /** One-line hook shown on cards, overrides the backend description. */
    tagline?: string
}

/**
 * Everything a game developer can register for their game.
 *
 * Only `gameId` and `Room` are required — a game with just those gets the
 * default directory card and the default detail page for free.
 */
export type GameModule = {
    gameId: string
    display?: GameDisplay
    /** In-match UI. Rendered by the room once status becomes `inProgress`. */
    Room: (props: GameRoomProps) => ReactNode
    /** Replaces the default `/games/:gameId` page. */
    Page?: (props: GamePageProps) => ReactNode
    /** Extra content in the pre-match waiting room. */
    LobbyPanel?: (props: GameLobbyPanelProps) => ReactNode
    /**
     * Builds a typed action helper around the raw channel, so game components
     * call `actions.move(from, to)` instead of hand-rolling JSON.
     */
    createActions?: (channel: GameChannel) => unknown
    /** Called after a match settles, for confetti / result overlays. */
    onMatchFinished?: (detail: LobbyDetail) => void
}
