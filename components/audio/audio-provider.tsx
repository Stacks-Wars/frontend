"use client"

import { useBackgroundMusic } from "@/lib/audio/use-background-music"

/** Mounts the soft BG playlist for the whole app. */
export function AudioProvider({ children }: { children: React.ReactNode }) {
    useBackgroundMusic()
    return <>{children}</>
}
