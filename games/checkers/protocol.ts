/** Wire shapes for `sw-checkers`. Mirrors `checkers/src/message.rs`. */

export type PieceColor = "red" | "black"
export type PieceKind = "man" | "king"

export type Piece = {
    color: PieceColor
    kind: PieceKind
}

export type Position = {
    row: number
    col: number
}

export type CheckersMove = {
    from: Position
    to: Position
    captured: Position | null
}

export type CheckersBoard = {
    cells: (Piece | null)[][]
}

export type EnginePlayer = {
    userId: string
    username: string | null
    displayName: string | null
    rank: number | null
}

export type ClockReading = {
    userId: string
    remainingMs: number
}

export type CheckersTurn = {
    type: "turn"
    player: EnginePlayer
    legalMoves: CheckersMove[]
    clocks: ClockReading[]
    turnDeadlineAt: number | null
    activeUserId: string | null
}

export type CheckersEvent =
    | { type: "boardUpdate"; board: CheckersBoard }
    | CheckersTurn
    | {
          type: "moveMade"
          player: EnginePlayer
          mv: CheckersMove
          becameKing: boolean
      }
    | { type: "invalid"; reason: string }
    | { type: "gameDraw"; reason: string }

/** `get_game_state` output attached to the room snapshot. */
export type CheckersSnapshot = {
    board: CheckersBoard | null
    turn: CheckersTurn | null
}

export function positionKey(position: Position): string {
    return `${position.row},${position.col}`
}

export function samePosition(a: Position, b: Position): boolean {
    return a.row === b.row && a.col === b.col
}
