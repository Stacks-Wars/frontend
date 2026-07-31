import { Separator as SeparatorPrimitive } from "@base-ui/react/separator"

import { cn } from "@/lib/utils"

function Separator({
    className,
    orientation = "horizontal",
    ...props
}: Omit<SeparatorPrimitive.Props, "className"> & { className?: string }) {
    return (
        <SeparatorPrimitive
            data-slot="separator"
            orientation={orientation}
            className={cn(
                "shrink-0 bg-border",
                orientation === "horizontal"
                    ? "h-px w-full"
                    : "w-px self-stretch",
                className
            )}
            {...props}
        />
    )
}

export { Separator }
