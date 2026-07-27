import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
    function Input({ className, type = "text", ...props }, ref) {
        return (
            <input
                ref={ref}
                type={type}
                data-slot="input"
                className={cn(
                    "flex h-11 w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50",
                    className
                )}
                {...props}
            />
        )
    }
)

Input.displayName = "Input"

export { Input }
