"use client"

import * as React from "react"

import { CheckersBoardView } from "@/games/checkers/board"
import {
    positionKey,
    samePosition,
    type CheckersBoard,
    type CheckersEvent,
    type CheckersMove,
    type CheckersSnapshot,
    type CheckersTurn,
    type Position,
} from "@/games/checkers/protocol"
import { EventFeed, useEventFeed } from "@/games/shared/event-feed"
import { GameShell } from "@/games/shared/game-shell"
import { PlayerRail } from "@/games/shared/player-rail"
import { TurnBar } from "@/games/shared/turn-bar"
import type { GameRoomProps } from "@/games/types"
import { playSfx } from "@/lib/audio/play-sound"
import { displayNameFor } from "@/lib/format"

function pieceCount(
    board: CheckersBoard | null,
    color: "red" | "black"
): number {
    if (!board) return 0
    return board.cells.flat().filter((piece) => piece?.color === color).length
}

export function CheckersRoom({
    players,
    selfUserId,
    initialState,
    channel,
    connection,
}: GameRoomProps) {
    const snapshot = initialState as CheckersSnapshot | null
    const [board, setBoard] = React.useState<CheckersBoard | null>(
        snapshot?.board ?? null
    )
    const [turn, setTurn] = React.useState<CheckersTurn | null>(
        snapshot?.turn ?? null
    )
    const [selected, setSelected] = React.useState<Position | null>(null)
    const [lastMove, setLastMove] = React.useState<CheckersMove | null>(null)
    const [error, setError] = React.useState<string | null>(null)
    const { lines, push } = useEventFeed()

    React.useEffect(() => {
        return channel.on((raw) => {
            const event = raw as CheckersEvent
            switch (event.type) {
                case "boardUpdate":
                    setBoard(event.board)
                    break
                case "turn":
                    setTurn(event)
                    setSelected(null)
                    setError(null)
                    break
                case "moveMade": {
                    setLastMove(event.mv)
                    const who = displayNameFor(event.player)
                    playSfx(event.mv.captured ? "pawnCapture" : "pawnMove")
                    push(
                        event.mv.captured
                            ? `${who} captured a piece`
                            : `${who} moved${event.becameKing ? " and crowned a king" : ""}`,
                        event.becameKing ? "good" : "default"
                    )
                    break
                }
                case "invalid":
                    playSfx("invalid")
                    setError(event.reason)
                    setSelected(null)
                    break
                case "gameDraw":
                    playSfx("end")
                    push(`Draw — ${event.reason}`, "muted")
                    break
                default:
                    break
            }
        })
    }, [channel, push])

    const isMyTurn = turn?.player.userId === selfUserId
    const legalMoves = isMyTurn ? (turn?.legalMoves ?? []) : []
    const interactive = isMyTurn && connection === "open"

    function onSelect(position: Position) {
        setError(null)
        if (!interactive) return

        if (selected) {
            const move = legalMoves.find(
                (candidate) =>
                    samePosition(candidate.from, selected) &&
                    samePosition(candidate.to, position)
            )
            if (move) {
                channel.send({ type: "move", from: move.from, to: move.to })
                setSelected(null)
                // The engine confirms with boardUpdate; no optimistic mutation
                // so the board can never disagree with the server.
                return
            }
            setSelected(
                legalMoves.some((m) => samePosition(m.from, position))
                    ? position
                    : null
            )
            return
        }

        if (legalMoves.some((move) => samePosition(move.from, position))) {
            playSfx("click")
            setSelected(position)
        }
    }

    // Seat order decides colours: first seat plays red.
    const seatIndex = players.findIndex((p) => p.userId === selfUserId)
    const myColor = seatIndex === 1 ? "black" : "red"

    const rail = (
        <>
            <PlayerRail
                selfUserId={selfUserId}
                players={players.map((player, index) => {
                    const color = index === 1 ? "black" : "red"
                    return {
                        userId: player.userId,
                        name: displayNameFor(player),
                        color:
                            color === "black"
                                ? "oklch(0.3 0.02 264)"
                                : "oklch(0.72 0.19 25)",
                        detail: `${pieceCount(board, color)} left`,
                        active: turn?.player.userId === player.userId,
                    }
                })}
            />
            <EventFeed lines={lines} />
        </>
    )

    return (
        <GameShell
            banner={
                <TurnBar
                    name={turn ? displayNameFor(turn.player) : null}
                    isYou={Boolean(isMyTurn)}
                    timeoutSecs={isMyTurn ? turn?.timeoutSecs : null}
                    resetKey={
                        turn
                            ? `${turn.player.userId}-${turn.timeoutSecs}`
                            : "idle"
                    }
                    hint={
                        error ??
                        (isMyTurn
                            ? selected
                                ? "Pick a square — or tap another piece"
                                : "Tap a glowing piece to move"
                            : undefined)
                    }
                />
            }
            stage={
                board ? (
                    <CheckersBoardView
                        board={board}
                        legalMoves={legalMoves}
                        selected={selected}
                        lastMove={lastMove}
                        interactive={interactive}
                        flipped={myColor === "black"}
                        onSelect={onSelect}
                    />
                ) : (
                    <div className="grid aspect-square w-full max-w-140 animate-pulse grid-cols-8 overflow-hidden rounded-xl">
                        {Array.from({ length: 64 }).map((_, index) => (
                            <div
                                key={index}
                                className={
                                    (Math.floor(index / 8) + index) % 2 === 1
                                        ? "bg-muted"
                                        : "bg-muted/40"
                                }
                            />
                        ))}
                    </div>
                )
            }
            rail={rail}
        />
    )
}

export function CheckersLobbyPanel() {
    return (
        <div className="space-y-2 rounded-xl border border-border/70 p-4 surface-raised">
            <p className="font-display text-sm">How Checkers plays here</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>Two players, red moves first.</li>
                <li>Captures are forced when one is available.</li>
                <li>
                    Reaching the far row crowns a king that can move backwards.
                </li>
                <li>Run out the clock on your turn and you forfeit it.</li>
            </ul>
        </div>
    )
}

export { positionKey }
