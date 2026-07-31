import * as React from "react"

import { cn } from "@/lib/utils"

function Input({
    className,
    type = "text",
    ...props
}: React.ComponentProps<"input">) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                "flex h-11 w-full min-w-0 rounded-lg border border-border bg-input px-3 py-2 text-sm transition-colors outline-none selection:bg-primary/30 file:mr-3 file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
                className
            )}
            {...props}
        />
    )
}

export { Input }
