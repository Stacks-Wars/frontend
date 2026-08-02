"use client"

import {
    GOALS,
    HOME_STRETCH,
    PLAYER_COLORS,
    PLAYER_STARTS,
    SAFE_SQUARES,
    TRACK,
    YARDS,
    YARD_BOXES,
    toPercent,
    type Cell,
} from "@/games/ludo/geometry"
import {
    homeStretchIndex,
    isFinished,
    isHome,
    trackIndex,
    type LudoBoard,
    type Pawn,
} from "@/games/ludo/protocol"
import { cn } from "@/lib/utils"

function pawnCell(pawn: Pawn): Cell {
    const track = trackIndex(pawn.position)
    if (track != null) return TRACK[track % TRACK.length]

    const stretch = homeStretchIndex(pawn.position)
    if (stretch != null) {
        return HOME_STRETCH[pawn.playerIndex][
            Math.min(stretch, HOME_STRETCH[pawn.playerIndex].length - 1)
        ]
    }

    if (isFinished(pawn.position)) return GOALS[pawn.playerIndex]
    return YARDS[pawn.playerIndex][pawn.id]
}

export function LudoBoardView({
    board,
    movablePawns,
    myPlayerIndex,
    interactive,
    onMovePawn,
}: {
    board: LudoBoard
    movablePawns: number[]
    myPlayerIndex: number | null
    interactive: boolean
    onMovePawn: (pawnId: number) => void
}) {
    const movable = new Set(interactive ? movablePawns : [])

    // Pawns sharing a square get nudged apart so a stack stays readable.
    const occupancy = new Map<string, number>()

    return (
        <div className="relative aspect-square w-full max-w-[min(620px,100%)] overflow-hidden rounded-xl bg-[oklch(0.22_0.015_264)] ring-1 ring-border-strong">
            {YARD_BOXES.map((box, index) => (
                <div
                    key={`yard-${index}`}
                    className="absolute rounded-lg"
                    style={{
                        left: `${(box.col / 15) * 100}%`,
                        top: `${(box.row / 15) * 100}%`,
                        width: `${(6 / 15) * 100}%`,
                        height: `${(6 / 15) * 100}%`,
                        background: `color-mix(in oklab, ${PLAYER_COLORS[index]} 18%, transparent)`,
                        border: `1px solid color-mix(in oklab, ${PLAYER_COLORS[index]} 45%, transparent)`,
                    }}
                />
            ))}

            {TRACK.map((cell, index) => {
                const startOwner = PLAYER_STARTS.indexOf(index)
                return (
                    <span
                        key={`track-${index}`}
                        className="absolute rounded-[3px] border border-white/8 bg-white/6"
                        style={{
                            left: `${(cell.col / 15) * 100}%`,
                            top: `${(cell.row / 15) * 100}%`,
                            width: `${(1 / 15) * 100}%`,
                            height: `${(1 / 15) * 100}%`,
                            background:
                                startOwner >= 0
                                    ? `color-mix(in oklab, ${PLAYER_COLORS[startOwner]} 55%, transparent)`
                                    : SAFE_SQUARES.has(index)
                                      ? "oklch(1 0 0 / 0.16)"
                                      : undefined,
                        }}
                    />
                )
            })}

            {HOME_STRETCH.map((path, playerIndex) =>
                path.map((cell, step) => (
                    <span
                        key={`stretch-${playerIndex}-${step}`}
                        className="absolute rounded-[3px]"
                        style={{
                            left: `${(cell.col / 15) * 100}%`,
                            top: `${(cell.row / 15) * 100}%`,
                            width: `${(1 / 15) * 100}%`,
                            height: `${(1 / 15) * 100}%`,
                            background: `color-mix(in oklab, ${PLAYER_COLORS[playerIndex]} ${40 + step * 8}%, transparent)`,
                        }}
                    />
                ))
            )}

            <span
                className="absolute grid place-items-center rounded-md bg-background/60 ring-1 ring-white/10"
                style={{
                    left: `${(6 / 15) * 100}%`,
                    top: `${(6 / 15) * 100}%`,
                    width: `${(3 / 15) * 100}%`,
                    height: `${(3 / 15) * 100}%`,
                }}
            >
                <span className="font-display text-[10px] tracking-widest text-muted-foreground uppercase">
                    Home
                </span>
            </span>

            {board.players.flatMap((player) =>
                player.pawns.map((pawn) => {
                    const cell = pawnCell(pawn)
                    const key = `${cell.row}:${cell.col}`
                    const stackIndex = occupancy.get(key) ?? 0
                    occupancy.set(key, stackIndex + 1)

                    const { left, top } = toPercent(cell)
                    const canMove =
                        movable.has(pawn.id) &&
                        pawn.playerIndex === myPlayerIndex
                    const parked = isHome(pawn.position)

                    return (
                        <button
                            key={`${player.userId}-${pawn.id}`}
                            type="button"
                            disabled={!canMove}
                            onClick={() => onMovePawn(pawn.id)}
                            aria-label={`Pawn ${pawn.id + 1}`}
                            className={cn(
                                "absolute grid size-[5.2%] -translate-x-1/2 -translate-y-1/2 place-items-center",
                                canMove ? "z-20" : "z-10",
                                parked && "opacity-90"
                            )}
                            style={{
                                left,
                                top,
                                marginLeft: stackIndex * 5,
                                marginTop: stackIndex * -3,
                            }}
                        >
                            <span
                                className={cn(
                                    "relative grid size-full place-items-center rounded-full text-[8px] font-semibold shadow-md transition-transform duration-300 ease-out",
                                    canMove
                                        ? "animate-piece-nudge cursor-pointer ring-2 ring-white hover:scale-110"
                                        : "cursor-default"
                                )}
                                style={{
                                    background: PLAYER_COLORS[pawn.playerIndex],
                                    color: "oklch(0.16 0.02 264)",
                                }}
                            >
                                {canMove ? (
                                    <span className="pointer-events-none absolute -inset-1 animate-live-pulse rounded-full ring-2 ring-primary/70" />
                                ) : null}
                                {pawn.id + 1}
                            </span>
                        </button>
                    )
                })
            )}
        </div>
    )
}
