/**
 * Board geometry for the classic 15×15 Ludo cross.
 *
 * The engine speaks in abstract positions (`onTrack(0..51)`, `homeStretch(0..4)`,
 * `home`, `finished`); everything here maps those onto grid cells so the board
 * component never has to know the rules.
 */

export type Cell = { row: number; col: number }

export const GRID = 15

/** The 52-cell main track, clockwise, starting at player 0's entry square. */
export const TRACK: Cell[] = [
    ...cells(6, [1, 2, 3, 4, 5]),
    ...rows([5, 4, 3, 2, 1, 0], 6),
    { row: 0, col: 7 },
    ...rows([0, 1, 2, 3, 4, 5], 8),
    ...cells(6, [9, 10, 11, 12, 13, 14]),
    { row: 7, col: 14 },
    ...cells(8, [14, 13, 12, 11, 10, 9]),
    ...rows([9, 10, 11, 12, 13, 14], 8),
    { row: 14, col: 7 },
    ...rows([14, 13, 12, 11, 10, 9], 6),
    ...cells(8, [5, 4, 3, 2, 1, 0]),
    { row: 7, col: 0 },
    { row: 6, col: 0 },
]

/** Track index each player enters the board on. Mirrors `PLAYER_STARTS`. */
export const PLAYER_STARTS = [0, 13, 26, 39]

/** Squares where pawns cannot be captured. Mirrors `SAFE_SQUARES`. */
export const SAFE_SQUARES = new Set([0, 8, 13, 21, 26, 34, 39, 47])

/** Five coloured cells leading from the track into each player's goal. */
export const HOME_STRETCH: Cell[][] = [
    cells(7, [1, 2, 3, 4, 5]),
    rows([1, 2, 3, 4, 5], 7),
    cells(7, [13, 12, 11, 10, 9]),
    rows([13, 12, 11, 10, 9], 7),
]

/** The four parking slots inside each player's yard. */
export const YARDS: Cell[][] = [
    [
        { row: 1.6, col: 1.6 },
        { row: 1.6, col: 3.4 },
        { row: 3.4, col: 1.6 },
        { row: 3.4, col: 3.4 },
    ],
    [
        { row: 1.6, col: 10.6 },
        { row: 1.6, col: 12.4 },
        { row: 3.4, col: 10.6 },
        { row: 3.4, col: 12.4 },
    ],
    [
        { row: 10.6, col: 10.6 },
        { row: 10.6, col: 12.4 },
        { row: 12.4, col: 10.6 },
        { row: 12.4, col: 12.4 },
    ],
    [
        { row: 10.6, col: 1.6 },
        { row: 10.6, col: 3.4 },
        { row: 12.4, col: 1.6 },
        { row: 12.4, col: 3.4 },
    ],
]

/** Where finished pawns stack, just inside the centre. */
export const GOALS: Cell[] = [
    { row: 7, col: 6.4 },
    { row: 6.4, col: 7 },
    { row: 7, col: 7.6 },
    { row: 7.6, col: 7 },
]

export const PLAYER_COLORS = [
    "oklch(0.66 0.2 25)", // red
    "oklch(0.72 0.17 150)", // green
    "oklch(0.82 0.15 85)", // yellow
    "oklch(0.66 0.16 250)", // blue
]

export const PLAYER_NAMES = ["Red", "Green", "Yellow", "Blue"]

/** Yard bounding boxes, used to paint the four corners. */
export const YARD_BOXES = [
    { row: 0, col: 0 },
    { row: 0, col: 9 },
    { row: 9, col: 9 },
    { row: 9, col: 0 },
]

function cells(row: number, columns: number[]): Cell[] {
    return columns.map((col) => ({ row, col }))
}

function rows(rowValues: number[], col: number): Cell[] {
    return rowValues.map((row) => ({ row, col }))
}

/** Percent offsets for absolute positioning inside the board square. */
export function toPercent(cell: Cell): { left: string; top: string } {
    return {
        left: `${((cell.col + 0.5) / GRID) * 100}%`,
        top: `${((cell.row + 0.5) / GRID) * 100}%`,
    }
}
