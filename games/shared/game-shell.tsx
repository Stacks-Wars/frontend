"use client"

import { cn } from "@/lib/utils"

/**
 * Common in-match layout: a stage that owns the game surface, and a rail for
 * turn order, standings, and the event feed. Games only supply the contents.
 */
export function GameShell({
    stage,
    rail,
    banner,
    className,
}: {
    stage: React.ReactNode
    rail?: React.ReactNode
    banner?: React.ReactNode
    className?: string
}) {
    return (
        <div className={cn("flex flex-col gap-4", className)}>
            {banner}
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="flex min-w-0 items-start justify-center rounded-2xl border border-border/70 p-4 surface-raised sm:p-6">
                    {stage}
                </div>
                {rail ? (
                    <div className="flex min-h-0 flex-col gap-4 lg:max-h-[640px] lg:overflow-hidden">
                        {rail}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
