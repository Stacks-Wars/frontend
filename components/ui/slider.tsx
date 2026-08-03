"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { cn } from "@/lib/utils"

function Slider({
    className,
    ...props
}: SliderPrimitive.Root.Props & { className?: string }) {
    return (
        <SliderPrimitive.Root
            data-slot="slider"
            className={cn(
                "relative flex w-full touch-none items-center select-none data-disabled:opacity-50",
                className
            )}
            {...props}
        >
            <SliderPrimitive.Control className="flex w-full items-center">
                <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-muted">
                    <SliderPrimitive.Indicator className="absolute h-full bg-primary" />
                    <SliderPrimitive.Thumb className="block size-4 rounded-full border border-border bg-foreground shadow-sm transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/40 data-dragging:ring-3 data-dragging:ring-ring/40" />
                </SliderPrimitive.Track>
            </SliderPrimitive.Control>
        </SliderPrimitive.Root>
    )
}

export { Slider }
