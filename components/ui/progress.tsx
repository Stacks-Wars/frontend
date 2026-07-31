"use client"

import { Progress as ProgressPrimitive } from "@base-ui/react/progress"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const progressIndicatorVariants = cva(
    "h-full rounded-full transition-all duration-500 ease-out",
    {
        variants: {
            tone: {
                primary: "bg-primary",
                gold: "bg-gold",
                success: "bg-success",
                live: "bg-live",
            },
        },
        defaultVariants: {
            tone: "primary",
        },
    }
)

function Progress({
    className,
    value = 0,
    tone = "primary",
    ...props
}: Omit<ProgressPrimitive.Root.Props, "className" | "value"> &
    VariantProps<typeof progressIndicatorVariants> & {
        className?: string
        value?: number | null
    }) {
    return (
        <ProgressPrimitive.Root
            data-slot="progress"
            value={value}
            className={cn("w-full", className)}
            {...props}
        >
            <ProgressPrimitive.Track
                data-slot="progress-track"
                className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
            >
                <ProgressPrimitive.Indicator
                    data-slot="progress-indicator"
                    className={progressIndicatorVariants({ tone })}
                />
            </ProgressPrimitive.Track>
        </ProgressPrimitive.Root>
    )
}

export { Progress, progressIndicatorVariants }
