"use client"

import { create } from "zustand"

type CreateLobbyState = {
    open: boolean
    gameId: string | undefined
    /** Bumped on each open so the dialog remounts and clears the form. */
    session: number
    actions: {
        open: (gameId?: string) => void
        setOpen: (open: boolean) => void
    }
}

export const useCreateLobbyStore = create<CreateLobbyState>((set) => ({
    open: false,
    gameId: undefined,
    session: 0,
    actions: {
        open: (gameId) =>
            set((state) => ({
                gameId,
                open: true,
                session: state.session + 1,
            })),
        setOpen: (open) => set({ open }),
    },
}))

export const useCreateLobbyOpen = () => useCreateLobbyStore((s) => s.open)
export const useCreateLobbyGameId = () =>
    useCreateLobbyStore((s) => s.gameId)
export const useCreateLobbySession = () =>
    useCreateLobbyStore((s) => s.session)
export const useCreateLobbyActions = () =>
    useCreateLobbyStore((s) => s.actions)

export function useCreateLobby() {
    return useCreateLobbyActions()
}
