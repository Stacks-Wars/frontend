"use client"

import { create } from "zustand"

import type { AppUser } from "@/lib/api/types"

type UserState = {
    user: AppUser | null
    loading: boolean
    setUser: (user: AppUser | null) => void
    setLoading: (loading: boolean) => void
}

export const useUserStore = create<UserState>((set) => ({
    user: null,
    loading: true,
    setUser: (user) => set({ user }),
    setLoading: (loading) => set({ loading }),
}))
