/** Canonical SFX paths under `/public/audio`. */
export const SFX = {
    click: "/audio/click.wav",
    alert: "/audio/alert.wav",
    beep: "/audio/beep.wav",
    error: "/audio/error.wav",
    invalid: "/audio/invalid.wav",
    success: "/audio/success.mp3",
    end: "/audio/end.mp3",
    win: "/audio/win.wav",
    diceRoll: "/audio/dice-roll.wav",
    pawnMove: "/audio/pawn-move.mp3",
    pawnCapture: "/audio/pawn-capture.wav",
} as const

export type SfxKey = keyof typeof SFX

/** Soft arena playlist (CC0 — Alexander Ehlers Free Music Pack). */
export const BG_TRACKS = [
    "/audio/bg/doomed.mp3",
    "/audio/bg/flags.mp3",
    "/audio/bg/great-mission.mp3",
    "/audio/bg/spacetime.mp3",
    "/audio/bg/twists.mp3",
    "/audio/bg/waking-the-devil.mp3",
    "/audio/bg/warped.mp3",
] as const
