"use client"

import { create } from "zustand"

import type { WalletBalance, AppUser } from "@/lib/api/types"
import { parseChainId, type ChainId } from "@/lib/chain"
import { writeStoredChain } from "@/lib/chain/storage"

type SessionState = {
    user: AppUser | null
    loading: boolean
    currentChain: ChainId
    needsChainPick: boolean
    balance: WalletBalance | null
    actions: {
        setUser: (user: AppUser | null) => void
        setLoading: (loading: boolean) => void
        setCurrentChain: (chain: ChainId) => void
        hydrateCurrentChain: (chain: ChainId) => void
        setNeedsChainPick: (needs: boolean) => void
        setBalance: (balance: WalletBalance | null) => void
        patchBalance: (partial: Partial<WalletBalance>) => void
    }
}

export const useSessionStore = create<SessionState>((set) => ({
    user: null,
    loading: true,
    currentChain: parseChainId(null),
    needsChainPick: false,
    balance: null,
    actions: {
        setUser: (user) =>
            set(user ? { user } : { user: null, needsChainPick: false }),
        setLoading: (loading) => set({ loading }),
        setCurrentChain: (chain) => {
            writeStoredChain(chain)
            set({ currentChain: parseChainId(chain), balance: null })
        },
        hydrateCurrentChain: (chain) =>
            set({ currentChain: parseChainId(chain) }),
        setNeedsChainPick: (needsChainPick) => set({ needsChainPick }),
        setBalance: (balance) => set({ balance }),
        patchBalance: (partial) =>
            set((state) => {
                if (
                    partial.chain &&
                    parseChainId(partial.chain) !== state.currentChain
                ) {
                    return {}
                }
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
                            address: partial.address ?? "",
                            chain: partial.chain ?? state.currentChain,
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
export const useSessionCurrentChain = () =>
    useSessionStore((s) => s.currentChain)
export const useSessionNeedsChainPick = () =>
    useSessionStore((s) => s.needsChainPick)
export const useSessionBalance = () => useSessionStore((s) => s.balance)
export const useSessionActions = () => useSessionStore((s) => s.actions)
