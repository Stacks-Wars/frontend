"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import * as React from "react"

import { AuthSync } from "@/components/auth/auth-sync"
import { ToastHost } from "@/components/notifications/toast-host"
import { AppWsProvider } from "@/components/ws/app-ws-provider"

export function Provider({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        staleTime: 30_000,
                        refetchOnWindowFocus: false,
                    },
                },
            })
    )

    return (
        <QueryClientProvider client={queryClient}>
            <AppWsProvider>
                <AuthSync />
                <ToastHost />
                {children}
            </AppWsProvider>
        </QueryClientProvider>
    )
}
