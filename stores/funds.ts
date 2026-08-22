"use client"

import { create } from "zustand"

export type OpenAddFundsOptions = {
    requiredMicro?: number
    availableMicro?: number
}

type FundsState = {
    open: boolean
    requiredMicro: number
    availableMicro: number
    actions: {
        open: (options?: OpenAddFundsOptions) => void
        setOpen: (open: boolean) => void
    }
}

export const useFundsStore = create<FundsState>((set) => ({
    open: false,
    requiredMicro: 0,
    availableMicro: 0,
    actions: {
        open: (options) =>
            set({
                requiredMicro: options?.requiredMicro ?? 0,
                availableMicro: options?.availableMicro ?? 0,
                open: true,
            }),
        setOpen: (open) => set({ open }),
    },
}))

export const useFundsOpen = () => useFundsStore((s) => s.open)
export const useFundsRequiredMicro = () =>
    useFundsStore((s) => s.requiredMicro)
export const useFundsAvailableMicro = () =>
    useFundsStore((s) => s.availableMicro)
export const useFundsActions = () => useFundsStore((s) => s.actions)

/** Opens the add-funds dialog from any route. */
export function useAddFunds() {
    return useFundsActions()
}
