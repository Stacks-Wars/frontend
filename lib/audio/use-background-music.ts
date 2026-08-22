"use client"

import * as React from "react"

import { BG_TRACKS } from "@/lib/audio/sounds"
import { useMusicEnabled, useMusicVolume } from "@/stores/sound"

function shuffle<T>(arr: readonly T[]): T[] {
    const out = [...arr]
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[out[i], out[j]] = [out[j], out[i]]
    }
    return out
}

/**
 * Soft looping playlist. Reshuffles when a full cycle completes.
 * Resumes on first user gesture to satisfy browser autoplay rules.
 */
export function useBackgroundMusic() {
    const musicEnabled = useMusicEnabled()
    const musicVolume = useMusicVolume()
    const audioRef = React.useRef<HTMLAudioElement | null>(null)
    const tracksRef = React.useRef<string[]>(shuffle(BG_TRACKS))
    const indexRef = React.useRef(0)
    const hasInteractedRef = React.useRef(false)

    const playNext = React.useCallback(() => {
        indexRef.current = (indexRef.current + 1) % tracksRef.current.length
        if (indexRef.current === 0) {
            tracksRef.current = shuffle(BG_TRACKS)
        }
        const audio = audioRef.current
        if (!audio) return
        audio.src = tracksRef.current[indexRef.current]
        void audio.play().catch(() => {})
    }, [])

    React.useEffect(() => {
        const audio = new Audio()
        audio.preload = "none"
        audio.addEventListener("ended", playNext)
        audioRef.current = audio
        return () => {
            audio.pause()
            audio.removeEventListener("ended", playNext)
            audio.src = ""
            audioRef.current = null
        }
    }, [playNext])

    React.useEffect(() => {
        const audio = audioRef.current
        if (!audio) return
        if (musicEnabled && musicVolume > 0) {
            if (!audio.src || audio.src === window.location.href) {
                audio.src = tracksRef.current[indexRef.current]
            }
            void audio.play().catch(() => {})
        } else {
            audio.pause()
        }
    }, [musicEnabled, musicVolume])

    React.useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = musicVolume
        }
    }, [musicVolume])

    React.useEffect(() => {
        if (!musicEnabled || musicVolume <= 0) return

        const resume = () => {
            if (hasInteractedRef.current) return
            hasInteractedRef.current = true
            const audio = audioRef.current
            if (audio?.paused) {
                if (!audio.src || audio.src === window.location.href) {
                    audio.src = tracksRef.current[indexRef.current]
                }
                void audio.play().catch(() => {})
            }
            document.removeEventListener("pointerdown", resume)
            document.removeEventListener("keydown", resume)
        }

        document.addEventListener("pointerdown", resume)
        document.addEventListener("keydown", resume)
        return () => {
            document.removeEventListener("pointerdown", resume)
            document.removeEventListener("keydown", resume)
        }
    }, [musicEnabled, musicVolume])
}
