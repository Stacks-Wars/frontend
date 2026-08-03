import { SFX, type SfxKey } from "@/lib/audio/sounds"
import { getSfxState } from "@/stores/sound"

/**
 * Play a one-shot sound effect. Respects SFX mute / volume prefs.
 * Each call creates a fresh element so overlapping SFX can stack.
 */
export function playSound(src: string = SFX.click) {
    const { sfxEnabled, sfxVolume } = getSfxState()
    if (!sfxEnabled || sfxVolume <= 0) return

    const audio = new Audio(src)
    audio.volume = sfxVolume
    void audio.play().catch(() => {
        /* autoplay / missing file — ignore */
    })
}

export function playSfx(key: SfxKey) {
    playSound(SFX[key])
}
