"use client"

import {
    positionKey,
    samePosition,
    type CheckersBoard,
    type CheckersMove,
    type Position,
} from "@/games/checkers/protocol"
import { cn } from "@/lib/utils"

/**
 * 8×8 board. The engine is authoritative: we render `board` as given and only
 * highlight destinations the engine listed in `legalMoves`.
 */
export function CheckersBoardView({
    board,
    legalMoves,
    selected,
    lastMove,
    interactive,
    flipped,
    onSelect,
}: {
    board: CheckersBoard
    legalMoves: CheckersMove[]
    selected: Position | null
    lastMove: CheckersMove | null
    interactive: boolean
    flipped: boolean
    onSelect: (position: Position) => void
}) {
    const origins = new Set(legalMoves.map((move) => positionKey(move.from)))
    const destinations = new Set(
        selected
            ? legalMoves
                  .filter((move) => samePosition(move.from, selected))
                  .map((move) => positionKey(move.to))
            : []
    )

    const rows = board.cells.map((_, index) => index)
    const ordered = flipped ? [...rows].reverse() : rows

    return (
        <div className="w-full max-w-[min(560px,100%)]">
            <div className="grid aspect-square grid-cols-8 overflow-hidden rounded-xl ring-1 ring-border-strong">
                {ordered.map((row) =>
                    (flipped
                        ? [...board.cells[row].keys()].reverse()
                        : [...board.cells[row].keys()]
                    ).map((col) => {
                        const piece = board.cells[row][col]
                        const position = { row, col }
                        const key = positionKey(position)
                        const dark = (row + col) % 2 === 1
                        const isSelected =
                            selected != null && samePosition(selected, position)
                        const isDestination = destinations.has(key)
                        const canPick =
                            interactive && origins.has(key) && !selected
                        const inLastMove =
                            lastMove != null &&
                            (samePosition(lastMove.from, position) ||
                                samePosition(lastMove.to, position))

                        return (
                            <button
                                key={key}
                                type="button"
                                disabled={
                                    !interactive ||
                                    (!canPick && !isDestination && !isSelected)
                                }
                                onClick={() => onSelect(position)}
                                aria-label={`Square ${row + 1}, ${col + 1}`}
                                className={cn(
                                    "relative aspect-square transition-colors",
                                    dark
                                        ? "bg-[oklch(0.28_0.03_264)]"
                                        : "bg-[oklch(0.86_0.02_84)]",
                                    inLastMove && "bg-primary/25",
                                    isSelected && "ring-2 ring-primary ring-inset",
                                    !interactive && "cursor-default"
                                )}
                            >
                                {piece ? (
                                    <span
                                        className={cn(
                                            "absolute inset-[14%] grid place-items-center rounded-full shadow-lg transition-transform",
                                            piece.color === "black"
                                                ? "bg-[oklch(0.24_0.02_264)] ring-2 ring-white/15 ring-inset"
                                                : "bg-[oklch(0.72_0.19_25)] ring-2 ring-white/25 ring-inset",
                                            canPick && "hover:scale-105"
                                        )}
                                    >
                                        {piece.kind === "king" ? (
                                            <span
                                                className="text-[11px] leading-none"
                                                aria-label="King"
                                            >
                                                👑
                                            </span>
                                        ) : null}
                                    </span>
                                ) : null}

                                {isDestination ? (
                                    <span className="absolute inset-0 grid place-items-center">
                                        <span className="size-[26%] animate-pop-in rounded-full bg-primary/70" />
                                    </span>
                                ) : null}

                                {canPick ? (
                                    <span className="absolute inset-1 rounded-md ring-1 ring-primary/40 ring-inset" />
                                ) : null}
                            </button>
                        )
                    })
                )}
            </div>
        </div>
    )
}
