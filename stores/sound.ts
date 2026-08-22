"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

type SoundState = {
    musicEnabled: boolean
    sfxEnabled: boolean
    /** 0–1, soft by default (2%) so music stays ambient. */
    musicVolume: number
    /** 0–1 */
    sfxVolume: number
    actions: {
        setMusicEnabled: (enabled: boolean) => void
        setSfxEnabled: (enabled: boolean) => void
        setMusicVolume: (volume: number) => void
        setSfxVolume: (volume: number) => void
    }
}

function clamp01(n: number) {
    if (Number.isNaN(n)) return 0
    return Math.min(1, Math.max(0, n))
}

export const useSoundStore = create<SoundState>()(
    persist(
        (set) => ({
            musicEnabled: true,
            sfxEnabled: true,
            musicVolume: 0.02,
            sfxVolume: 0.4,
            actions: {
                setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
                setSfxEnabled: (sfxEnabled) => set({ sfxEnabled }),
                setMusicVolume: (musicVolume) =>
                    set({ musicVolume: clamp01(musicVolume) }),
                setSfxVolume: (sfxVolume) =>
                    set({ sfxVolume: clamp01(sfxVolume) }),
            },
        }),
        {
            name: "sw-sound",
            partialize: (state) => ({
                musicEnabled: state.musicEnabled,
                sfxEnabled: state.sfxEnabled,
                musicVolume: state.musicVolume,
                sfxVolume: state.sfxVolume,
            }),
        }
    )
)

export const useMusicEnabled = () => useSoundStore((s) => s.musicEnabled)
export const useSfxEnabled = () => useSoundStore((s) => s.sfxEnabled)
export const useMusicVolume = () => useSoundStore((s) => s.musicVolume)
export const useSfxVolume = () => useSoundStore((s) => s.sfxVolume)
export const useSoundActions = () => useSoundStore((s) => s.actions)

/** Non-React reader for one-shot SFX helpers. */
export function getSfxState() {
    const { sfxEnabled, sfxVolume } = useSoundStore.getState()
    return { sfxEnabled, sfxVolume }
}
