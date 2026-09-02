"use client"

import { create } from "zustand"

import { playSfx } from "@/lib/audio/play-sound"

export type NotificationItem = {
    id: string
    title: string
    body?: string
    createdAt: number
    read: boolean
    href?: string
    tag?: string
}

type ToastItem = {
    id: string
    title: string
    body?: string
    tone?: "default" | "success" | "danger"
    /** Skip the default toast SFX (caller plays a custom cue). */
    silent?: boolean
    href?: string
    cta?: string
}

type NotificationsState = {
    items: NotificationItem[]
    toasts: ToastItem[]
    actions: {
        push: (
            item: Omit<NotificationItem, "id" | "createdAt" | "read"> & {
                id?: string
            }
        ) => void
        dismissByTag: (tag: string) => void
        markRead: (id: string) => void
        markAllRead: () => void
        toast: (toast: Omit<ToastItem, "id">) => void
        dismissToast: (id: string) => void
    }
}

function id() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
    items: [],
    toasts: [],
    actions: {
        push: (item) =>
            set((state) => {
                const nextId = item.id ?? item.tag ?? id()
                const without = item.tag
                    ? state.items.filter((n) => n.tag !== item.tag)
                    : state.items.filter((n) => n.id !== nextId)
                return {
                    items: [
                        {
                            ...item,
                            id: nextId,
                            createdAt: Date.now(),
                            read: false,
                        },
                        ...without,
                    ].slice(0, 50),
                }
            }),
        dismissByTag: (tag) =>
            set((state) => ({
                items: state.items.filter((n) => n.tag !== tag),
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
            if (!toast.silent) {
                if (toast.tone === "danger") playSfx("error")
                else if (toast.tone === "success") playSfx("success")
                else playSfx("alert")
            }
            set((state) => ({
                toasts: [...state.toasts, { ...toast, id: toastId }],
            }))
            window.setTimeout(
                () => {
                    set((state) => ({
                        toasts: state.toasts.filter((t) => t.id !== toastId),
                    }))
                },
                toast.href ? 7000 : 4200
            )
        },
        dismissToast: (toastId) =>
            set((state) => ({
                toasts: state.toasts.filter((t) => t.id !== toastId),
            })),
    },
}))

export const useNotificationItems = () =>
    useNotificationsStore((s) => s.items)
export const useToasts = () => useNotificationsStore((s) => s.toasts)
export const useNotificationActions = () =>
    useNotificationsStore((s) => s.actions)
