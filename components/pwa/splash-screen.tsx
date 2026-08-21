"use client"

import Image from "next/image"

import { useIsOffline } from "@/lib/offline"
import { cn } from "@/lib/utils"

export function SplashScreen({ className }: { className?: string }) {
    const offline = useIsOffline()

    return (
        <div
            className={cn(
                "grid min-h-svh place-items-center bg-background px-6",
                className
            )}
        >
            <div className="flex flex-col items-center gap-5">
                <Image
                    src="/logo.png"
                    alt="Stacks Wars"
                    width={72}
                    height={72}
                    priority
                    className="size-18 animate-splash-pulse rounded-2xl object-contain"
                />
                <p className="font-display text-lg tracking-tight">
                    Stacks Wars
                </p>
                <p className="text-sm text-muted-foreground">
                    {offline ? "Waiting for connection…" : "Loading the arena…"}
                </p>
            </div>
        </div>
    )
}
