import * as React from "react"

import { cn } from "@/lib/utils"

interface EmptyStateProps {
    icon?: React.ReactNode
    title: string
    description?: string
    action?: React.ReactNode
    className?: string
}

function EmptyState({
    icon,
    title,
    description,
    action,
    className,
}: EmptyStateProps) {
    return (
        <div
            data-slot="empty-state"
            className={cn(
                "flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center",
                className
            )}
        >
            {icon ? (
                <div
                    data-slot="empty-state-icon"
                    className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-5"
                >
                    {icon}
                </div>
            ) : null}
            <div className="flex flex-col gap-1.5">
                <p
                    data-slot="empty-state-title"
                    className="font-display text-base"
                >
                    {title}
                </p>
                {description ? (
                    <p
                        data-slot="empty-state-description"
                        className="max-w-sm text-sm text-muted-foreground"
                    >
                        {description}
                    </p>
                ) : null}
            </div>
            {action ? (
                <div data-slot="empty-state-action" className="mt-2">
                    {action}
                </div>
            ) : null}
        </div>
    )
}

export { EmptyState, type EmptyStateProps }
