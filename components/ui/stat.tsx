import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const statValueVariants = cva("tnum font-display text-2xl leading-none", {
    variants: {
        tone: {
            default: "text-foreground",
            gold: "text-gold",
            success: "text-success",
            live: "text-live",
        },
    },
    defaultVariants: {
        tone: "default",
    },
})

interface StatProps extends VariantProps<typeof statValueVariants> {
    label: string
    value: React.ReactNode
    hint?: React.ReactNode
    icon?: React.ReactNode
    className?: string
}

function Stat({
    label,
    value,
    hint,
    icon,
    tone = "default",
    className,
}: StatProps) {
    return (
        <div
            data-slot="stat"
            className={cn("flex items-start gap-3", className)}
        >
            {icon ? (
                <div
                    data-slot="stat-icon"
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground [&_svg:not([class*='size-'])]:size-4"
                >
                    {icon}
                </div>
            ) : null}
            <div className="flex min-w-0 flex-col gap-1.5">
                <p
                    data-slot="stat-label"
                    className="text-xs font-medium tracking-wide text-muted-foreground uppercase"
                >
                    {label}
                </p>
                <p
                    data-slot="stat-value"
                    className={statValueVariants({ tone })}
                >
                    {value}
                </p>
                {hint ? (
                    <p
                        data-slot="stat-hint"
                        className="text-xs text-muted-foreground"
                    >
                        {hint}
                    </p>
                ) : null}
            </div>
        </div>
    )
}

export { Stat, statValueVariants, type StatProps }
