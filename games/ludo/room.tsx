"use client"

import * as React from "react"

import { Button } from "@/components/ui"
import { LudoBoardView } from "@/games/ludo/board"
import { Die } from "@/games/ludo/dice"
import { PLAYER_COLORS, PLAYER_NAMES } from "@/games/ludo/geometry"
import type {
    LudoBoard,
    LudoEvent,
    LudoSnapshot,
    TurnPhase,
} from "@/games/ludo/protocol"
import { EventFeed, useEventFeed } from "@/games/shared/event-feed"
import { GameShell } from "@/games/shared/game-shell"
import { PlayerRail } from "@/games/shared/player-rail"
import { TurnBar } from "@/games/shared/turn-bar"
import type { GameRoomProps } from "@/games/types"
import { displayNameFor } from "@/lib/format"

type Dice = {
    dice1: number | null
    dice2: number | null
    dice1Remaining: boolean
    dice2Remaining: boolean
}

function orderedPlayableValues(
    dice1: number | null,
    dice2: number | null,
    playable: number[]
): number[] {
    if (dice1 == null || dice2 == null) return playable
    const preferred = [dice1, dice1 + dice2, dice2]
    const seen = new Set<number>()
    const ordered: number[] = []
    for (const value of preferred) {
        if (playable.includes(value) && !seen.has(value)) {
            seen.add(value)
            ordered.push(value)
        }
    }
    for (const value of playable) {
        if (!seen.has(value)) ordered.push(value)
    }
    return ordered
}

export function LudoRoom({
    players,
    selfUserId,
    initialState,
    channel,
    connection,
}: GameRoomProps) {
    const snapshot = initialState as LudoSnapshot | null

    const [board, setBoard] = React.useState<LudoBoard | null>(
        snapshot?.board ?? null
    )
    const [turn, setTurn] = React.useState(snapshot?.turn ?? null)
    const [phase, setPhase] = React.useState<TurnPhase>(
        snapshot?.turnPhase ?? "WaitingForRoll"
    )
    const [dice, setDice] = React.useState<Dice>({
        dice1: snapshot?.dice1 ?? null,
        dice2: snapshot?.dice2 ?? null,
        dice1Remaining: snapshot?.dice1Remaining ?? false,
        dice2Remaining: snapshot?.dice2Remaining ?? false,
    })
    const [playableValues, setPlayableValues] = React.useState<number[]>(
        snapshot?.playableValues ?? []
    )
    const [selectedValue, setSelectedValue] = React.useState<number | null>(
        snapshot?.selectedDiceValue ?? null
    )
    const [movablePawns, setMovablePawns] = React.useState<number[]>(
        snapshot?.movablePawns ?? []
    )
    /** Engine-driven shot clock (roll = 5s, move = 15s via countdown events). */
    const [clockSecs, setClockSecs] = React.useState<number | null>(
        snapshot?.turn?.timeoutSecs ?? null
    )
    const [error, setError] = React.useState<string | null>(null)
    const { lines, push } = useEventFeed()

    React.useEffect(() => {
        return channel.on((raw) => {
            const event = raw as LudoEvent
            switch (event.type) {
                case "boardUpdate":
                    setBoard(event.board)
                    break
                case "turn":
                    setTurn(event)
                    setPhase("WaitingForRoll")
                    setDice({
                        dice1: null,
                        dice2: null,
                        dice1Remaining: false,
                        dice2Remaining: false,
                    })
                    setPlayableValues([])
                    setSelectedValue(null)
                    setMovablePawns([])
                    setClockSecs(event.timeoutSecs)
                    setError(null)
                    break
                case "countdown":
                    // Engine is the source of truth for remaining time (5s roll / 15s move).
                    setClockSecs(event.time)
                    break
                case "diceRolled":
                    setPhase("WaitingForMove")
                    setDice({
                        dice1: event.dice1,
                        dice2: event.dice2,
                        dice1Remaining: true,
                        dice2Remaining: true,
                    })
                    setPlayableValues(event.playableValues)
                    setSelectedValue(null)
                    setMovablePawns([])
                    // Next `countdown` tick carries MOVE_TIMEOUT_SECS from the engine.
                    push(
                        `${displayNameFor(event.player)} rolled ${event.dice1} and ${event.dice2}`
                    )
                    break
                case "movablePawns":
                    setSelectedValue(event.diceValue)
                    setMovablePawns(event.pawns)
                    break
                case "diceValueUsed":
                    setPlayableValues(event.remainingValues)
                    setSelectedValue(null)
                    setMovablePawns([])
                    setDice((prev) => ({
                        ...prev,
                        dice1Remaining:
                            prev.dice1Remaining &&
                            event.diceValue !== prev.dice1,
                        dice2Remaining:
                            prev.dice2Remaining &&
                            event.diceValue !== prev.dice2,
                    }))
                    break
                case "pawnCaptured":
                    push(
                        `${displayNameFor(event.attacker)} knocked out ${displayNameFor(event.victim)}`,
                        "bad"
                    )
                    break
                case "pawnFinished":
                    push(
                        `${displayNameFor(event.player)} brought a pawn home — ${event.pawnsRemaining} to go`,
                        "good"
                    )
                    break
                case "bonusTurn":
                    push(
                        `${displayNameFor(event.player)} earned a bonus turn`,
                        "good"
                    )
                    break
                case "noValidMoves":
                    push(
                        `${displayNameFor(event.player)} had no legal move`,
                        "muted"
                    )
                    break
                case "playerQuit":
                    push(
                        `${displayNameFor(event.player)} left the match`,
                        "muted"
                    )
                    break
                case "invalid":
                    setError(event.reason)
                    break
                default:
                    break
            }
        })
    }, [channel, push])

    const isMyTurn = turn?.player.userId === selfUserId
    const live = connection === "open"
    const myPlayerIndex =
        board?.players.find((p) => p.userId === selfUserId)?.playerIndex ?? null

    const moveValues = orderedPlayableValues(
        dice.dice1,
        dice.dice2,
        playableValues
    )

    function roll() {
        setError(null)
        channel.send({ type: "rollDice" })
    }

    function chooseValue(value: number) {
        setError(null)
        channel.send({ type: "selectDiceValue", diceValue: value })
    }

    function movePawn(pawnId: number) {
        setError(null)
        channel.send({ type: "movePawn", pawnId })
    }

    const controls = (
        <div className="flex w-full flex-col items-center gap-3">
            <div className="flex items-center gap-3">
                <Die
                    value={dice.dice1}
                    spent={dice.dice1 != null && !dice.dice1Remaining}
                />
                <Die
                    value={dice.dice2}
                    spent={dice.dice2 != null && !dice.dice2Remaining}
                />
            </div>

            {isMyTurn && phase === "WaitingForRoll" ? (
                <Button
                    variant="primary"
                    size="lg"
                    disabled={!live}
                    onClick={roll}
                    className="animate-action-pulse"
                >
                    Roll the dice
                </Button>
            ) : null}

            {isMyTurn && phase === "WaitingForMove" ? (
                playableValues.length > 0 ? (
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-xs text-muted-foreground">
                            {selectedValue == null
                                ? "Choose a value to play"
                                : "Tap a glowing pawn"}
                        </p>
                        <div className="flex flex-wrap justify-center gap-2">
                            {moveValues.map((value) => {
                                const selected = selectedValue === value
                                return (
                                    <Button
                                        key={value}
                                        size="sm"
                                        variant={
                                            selected ? "primary" : "outline"
                                        }
                                        disabled={!live}
                                        onClick={() => chooseValue(value)}
                                        className={
                                            selectedValue == null
                                                ? "animate-action-pulse"
                                                : undefined
                                        }
                                    >
                                        Move {value}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        No legal moves — passing turn.
                    </p>
                )
            ) : null}

            {error ? (
                <p className="animate-pop-in text-sm text-destructive">
                    {error}
                </p>
            ) : null}
        </div>
    )

    return (
        <GameShell
            banner={
                <TurnBar
                    name={turn ? displayNameFor(turn.player) : null}
                    isYou={Boolean(isMyTurn)}
                    timeoutSecs={isMyTurn ? clockSecs : null}
                    resetKey={`${turn?.player.userId ?? "idle"}-${phase}-${clockSecs ?? 0}`}
                    hint={
                        isMyTurn
                            ? phase === "WaitingForRoll"
                                ? "Roll to start your turn"
                                : selectedValue == null
                                  ? "Play your dice"
                                  : "Tap a glowing pawn"
                            : undefined
                    }
                />
            }
            stage={
                <div className="flex w-full flex-col items-center gap-5">
                    {board ? (
                        <LudoBoardView
                            board={board}
                            movablePawns={movablePawns}
                            myPlayerIndex={myPlayerIndex}
                            interactive={Boolean(isMyTurn) && live}
                            onMovePawn={movePawn}
                        />
                    ) : (
                        <div className="aspect-square w-full max-w-155 animate-pulse rounded-xl bg-muted/50" />
                    )}
                    {controls}
                </div>
            }
            rail={
                <>
                    <PlayerRail
                        selfUserId={selfUserId}
                        players={players.map((player) => {
                            const seat = board?.players.find(
                                (p) => p.userId === player.userId
                            )
                            const index = seat?.playerIndex ?? 0
                            return {
                                userId: player.userId,
                                name: displayNameFor(player),
                                color: PLAYER_COLORS[index],
                                detail: seat
                                    ? `${seat.pawnsFinished}/4 · ${PLAYER_NAMES[index]}`
                                    : undefined,
                                active: turn?.player.userId === player.userId,
                            }
                        })}
                    />
                    <EventFeed
                        lines={lines}
                        emptyLabel="Waiting for the first roll…"
                    />
                </>
            }
        />
    )
}

export function LudoLobbyPanel({ rush }: { rush?: boolean }) {
    return (
        <div className="space-y-2 rounded-xl border border-border/70 p-4 surface-raised">
            <p className="font-display text-sm">
                How {rush ? "Ludo Rush" : "Ludo"} plays here
            </p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>
                    Two dice per turn — play each value separately or as a sum.
                </li>
                <li>Only a single die can bring a pawn out of the yard.</li>
                <li>
                    Land on an opponent off a safe square to send them home.
                </li>
                <li>
                    {rush
                        ? "Shorter track, faster finishes."
                        : "First to walk all four pawns home wins."}
                </li>
            </ul>
        </div>
    )
}
