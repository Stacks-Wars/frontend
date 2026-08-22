"use client"

import { create } from "zustand"

import type { ConnectionStatus } from "@/lib/ws/app-socket"

type ConnectionState = {
    status: ConnectionStatus
    actions: {
        setStatus: (status: ConnectionStatus) => void
    }
}

export const useConnectionStore = create<ConnectionState>((set) => ({
    status: "idle",
    actions: {
        setStatus: (status) => set({ status }),
    },
}))

export const useConnectionStatus = () =>
    useConnectionStore((s) => s.status)
export const useConnectionActions = () =>
    useConnectionStore((s) => s.actions)
