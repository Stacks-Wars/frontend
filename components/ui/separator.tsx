import * as React from "react"

import { cn } from "@/lib/utils"

function Separator({
    className,
    orientation = "horizontal",
    ...props
}: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
    return (
        <div
            data-slot="separator"
            role="separator"
            aria-orientation={orientation}
            className={cn(
                orientation === "horizontal"
                    ? "h-px w-full"
                    : "w-px self-stretch",
                "bg-border",
                className
            )}
            {...props}
        />
    )
}

export { Separator }
