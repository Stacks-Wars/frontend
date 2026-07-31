/**
 * Wire shapes for `sw-ludo` and `sw-ludo-rush`.
 *
 * Both crates expose an identical protocol, so one implementation serves both
 * games and only the registration differs.
 */

export type EnginePlayer = {
    userId: string
    username: string | null
    displayName: string | null
}

/** Rust externally-tagged enum: `"home"`, `{ onTrack: 12 }`, … */
export type PawnPosition =
    | "home"
    | "finished"
    | { onTrack: number }
    | { homeStretch: number }

export type Pawn = {
    id: number
    playerIndex: number
    position: PawnPosition
}

export type PlayerBoardState = {
    userId: string
    playerIndex: number
    pawns: Pawn[]
    pawnsFinished: number
}

export type LudoBoard = {
    players: PlayerBoardState[]
}

export type LudoEvent =
    | { type: "boardUpdate"; board: LudoBoard }
    | { type: "turn"; player: EnginePlayer; timeoutSecs: number }
    | {
          type: "diceRolled"
          player: EnginePlayer
          dice1: number
          dice2: number
          playableValues: number[]
      }
    | { type: "movablePawns"; diceValue: number; pawns: number[] }
    | { type: "diceValueUsed"; diceValue: number; remainingValues: number[] }
    | {
          type: "pawnMoved"
          player: EnginePlayer
          pawnId: number
          from: PawnPosition
          to: PawnPosition
          diceValue: number
      }
    | {
          type: "pawnCaptured"
          attacker: EnginePlayer
          victim: EnginePlayer
          pawnId: number
      }
    | {
          type: "pawnFinished"
          player: EnginePlayer
          pawnId: number
          pawnsRemaining: number
      }
    | { type: "noValidMoves"; player: EnginePlayer }
    | { type: "bonusTurn"; player: EnginePlayer }
    | { type: "playerQuit"; player: EnginePlayer; reason: string }
    | { type: "countdown"; time: number }
    | { type: "invalid"; reason: string }

export type TurnPhase = "WaitingForRoll" | "WaitingForMove" | "Complete"

export type LudoSnapshot = {
    board: LudoBoard | null
    turn: { player: EnginePlayer; timeoutSecs: number } | null
    turnPhase: TurnPhase | null
    dice1: number | null
    dice2: number | null
    dice1Remaining: boolean
    dice2Remaining: boolean
    selectedDiceValue: number | null
    movablePawns: number[]
    playableValues: number[]
}

export function isHome(position: PawnPosition): boolean {
    return position === "home"
}

export function isFinished(position: PawnPosition): boolean {
    return position === "finished"
}

export function trackIndex(position: PawnPosition): number | null {
    return typeof position === "object" && "onTrack" in position
        ? position.onTrack
        : null
}

export function homeStretchIndex(position: PawnPosition): number | null {
    return typeof position === "object" && "homeStretch" in position
        ? position.homeStretch
        : null
}
