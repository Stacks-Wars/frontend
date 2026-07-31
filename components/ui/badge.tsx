import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
    "inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-colors [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3",
    {
        variants: {
            variant: {
                default: "bg-secondary text-secondary-foreground",
                primary: "bg-primary/15 text-primary",
                gold: "bg-gold/15 text-gold",
                success: "bg-success/15 text-success",
                warning: "bg-warning/15 text-warning",
                destructive: "bg-destructive/15 text-destructive",
                outline: "border-border text-muted-foreground",
                live: "bg-live/15 font-semibold tracking-wide text-live uppercase",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
)

function LiveDot({ className, ...props }: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="live-dot"
            className={cn(
                "size-1.5 shrink-0 animate-live-pulse rounded-full bg-live",
                className
            )}
            {...props}
        />
    )
}

function Badge({
    className,
    variant = "default",
    children,
    ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
    return (
        <span
            data-slot="badge"
            className={cn(badgeVariants({ variant, className }))}
            {...props}
        >
            {variant === "live" ? <LiveDot /> : null}
            {children}
        </span>
    )
}

export { Badge, LiveDot, badgeVariants }
