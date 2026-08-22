"use client"

import { create } from "zustand"

import type { WalletBalance, AppUser } from "@/lib/api/types"

type SessionState = {
    user: AppUser | null
    loading: boolean
    balance: WalletBalance | null
    actions: {
        setUser: (user: AppUser | null) => void
        setLoading: (loading: boolean) => void
        setBalance: (balance: WalletBalance | null) => void
        patchBalance: (partial: Partial<WalletBalance>) => void
    }
}

export const useSessionStore = create<SessionState>((set) => ({
    user: null,
    loading: true,
    balance: null,
    actions: {
        setUser: (user) => set({ user }),
        setLoading: (loading) => set({ loading }),
        setBalance: (balance) => set({ balance }),
        patchBalance: (partial) =>
            set((state) => {
                if (state.balance) {
                    return { balance: { ...state.balance, ...partial } }
                }
                if (
                    typeof partial.availableMicro === "number" &&
                    state.user
                ) {
                    return {
                        balance: {
                            userId: state.user.id,
                            stxAddress: partial.stxAddress ?? "",
                            availableMicro: partial.availableMicro,
                            updatedAt: new Date().toISOString(),
                        },
                    }
                }
                return {}
            }),
    },
}))

export const useSessionUser = () => useSessionStore((s) => s.user)
export const useSessionLoading = () => useSessionStore((s) => s.loading)
export const useSessionBalance = () => useSessionStore((s) => s.balance)
export const useSessionActions = () => useSessionStore((s) => s.actions)
