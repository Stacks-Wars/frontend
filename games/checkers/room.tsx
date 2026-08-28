"use client"

import * as React from "react"

import { CheckersBoardView } from "@/games/checkers/board"
import { ClockStrip } from "@/games/checkers/clock-bar"
import {
    samePosition,
    type CheckersBoard,
    type CheckersEvent,
    type CheckersMove,
    type CheckersSnapshot,
    type CheckersTurn,
    type ClockReading,
    type Position,
} from "@/games/checkers/protocol"
import { EventFeed, useEventFeed } from "@/games/shared/event-feed"
import { GameShell } from "@/games/shared/game-shell"
import { PlayerRail } from "@/games/shared/player-rail"
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

function clockFor(
    clocks: ClockReading[] | undefined,
    userId: string | undefined
): ClockReading | undefined {
    if (!userId) return undefined
    return clocks?.find((clock) => clock.userId === userId)
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
                    push(event.reason, "muted")
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

    const seatIndex = players.findIndex((p) => p.userId === selfUserId)
    const playing = seatIndex >= 0
    const myColor = seatIndex === 1 ? "black" : "red"
    const bottomId = playing ? selfUserId : players[0]?.userId
    const topPlayer = players.find((player) => player.userId !== bottomId)
    const bottomPlayer = players.find((player) => player.userId === bottomId)
    const deadlineAt = turn?.turnDeadlineAt ?? null
    const activeId = turn?.activeUserId ?? turn?.player.userId ?? null

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
                    }
                })}
            />
            <EventFeed lines={lines} />
        </>
    )

    return (
        <GameShell
            stage={
                <div className="flex w-full flex-col items-center gap-1">
                    {topPlayer ? (
                        <ClockStrip
                            name={displayNameFor(topPlayer)}
                            clock={clockFor(turn?.clocks, topPlayer.userId)}
                            deadlineAt={deadlineAt}
                            running={activeId === topPlayer.userId}
                        />
                    ) : null}
                    {board ? (
                        <CheckersBoardView
                            board={board}
                            legalMoves={legalMoves}
                            selected={selected}
                            lastMove={lastMove}
                            interactive={interactive}
                            flipped={playing && myColor === "black"}
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
                    )}
                    {bottomPlayer ? (
                        <ClockStrip
                            name={displayNameFor(bottomPlayer)}
                            clock={clockFor(turn?.clocks, bottomPlayer.userId)}
                            deadlineAt={deadlineAt}
                            running={activeId === bottomPlayer.userId}
                        />
                    ) : null}
                </div>
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
                <li>Two players, red moves first. Each clock starts at 5:00.</li>
                <li>Captures are forced when one is available.</li>
                <li>
                    Reaching the far row crowns a king that can move backwards.
                </li>
                <li>
                    Your clock only runs on your turn. Flag, forfeit, or lose
                    your last piece and the opponent wins the pot.
                </li>
                <li>
                    A draw returns each paid entry in full — no platform or
                    game fee.
                </li>
            </ul>
        </div>
    )
}

export { positionKey } from "@/games/checkers/protocol"
