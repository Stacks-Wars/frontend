"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

type InstallState = {
    /** iOS Safari, not already on the Home Screen. */
    eligible: boolean
    dismissed: boolean
    actions: {
        evaluate: () => void
        dismiss: () => void
    }
}

function isIos() {
    if (typeof navigator === "undefined") return false
    return (
        /iPad|iPhone|iPod/.test(navigator.userAgent) && !("MSStream" in window)
    )
}

function isStandalone() {
    if (typeof window === "undefined") return false
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    )
}

export const useInstallStore = create<InstallState>()(
    persist(
        (set) => ({
            eligible: false,
            dismissed: false,
            actions: {
                evaluate: () =>
                    set((state) => ({
                        eligible: isIos() && !isStandalone(),
                        dismissed: state.dismissed,
                    })),
                dismiss: () => set({ dismissed: true }),
            },
        }),
        {
            name: "sw-install",
            partialize: (state) => ({ dismissed: state.dismissed }),
        }
    )
)

export const useInstallEligible = () => useInstallStore((s) => s.eligible)
export const useInstallDismissed = () => useInstallStore((s) => s.dismissed)
export const useInstallActions = () => useInstallStore((s) => s.actions)
