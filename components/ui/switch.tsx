"use client"

import { Switch as SwitchPrimitive } from "@base-ui/react/switch"

import { cn } from "@/lib/utils"

function Switch({
    className,
    ...props
}: Omit<SwitchPrimitive.Root.Props, "className"> & { className?: string }) {
    return (
        <SwitchPrimitive.Root
            data-slot="switch"
            className={cn(
                "inline-flex h-6 w-11 shrink-0 cursor-default items-center rounded-full border border-border bg-muted p-0.5 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 data-checked:border-primary data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:opacity-50",
                className
            )}
            {...props}
        >
            <SwitchPrimitive.Thumb
                data-slot="switch-thumb"
                className="size-4.5 rounded-full bg-foreground shadow-sm transition-transform duration-200 ease-out data-checked:translate-x-5 data-checked:bg-primary-foreground"
            />
        </SwitchPrimitive.Root>
    )
}

export { Switch }
