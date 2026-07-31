"use client"

import { create } from "zustand"

export type NotificationItem = {
    id: string
    title: string
    body?: string
    createdAt: number
    read: boolean
    href?: string
}

type ToastItem = {
    id: string
    title: string
    body?: string
    tone?: "default" | "success" | "danger"
}

type NotificationsState = {
    items: NotificationItem[]
    toasts: ToastItem[]
    push: (item: Omit<NotificationItem, "id" | "createdAt" | "read">) => void
    markRead: (id: string) => void
    markAllRead: () => void
    toast: (toast: Omit<ToastItem, "id">) => void
    dismissToast: (id: string) => void
}

function id() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
    items: [],
    toasts: [],
    push: (item) =>
        set((state) => ({
            items: [
                {
                    ...item,
                    id: id(),
                    createdAt: Date.now(),
                    read: false,
                },
                ...state.items,
            ].slice(0, 50),
        })),
    markRead: (itemId) =>
        set((state) => ({
            items: state.items.map((n) =>
                n.id === itemId ? { ...n, read: true } : n
            ),
        })),
    markAllRead: () =>
        set((state) => ({
            items: state.items.map((n) => ({ ...n, read: true })),
        })),
    toast: (toast) => {
        const toastId = id()
        set((state) => ({
            toasts: [...state.toasts, { ...toast, id: toastId }],
        }))
        window.setTimeout(() => {
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== toastId),
            }))
        }, 4200)
    },
    dismissToast: (toastId) =>
        set((state) => ({
            toasts: state.toasts.filter((t) => t.id !== toastId),
        })),
}))
