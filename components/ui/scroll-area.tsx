"use client"

import { ScrollArea as ScrollAreaPrimitive } from "@base-ui/react/scroll-area"

import { cn } from "@/lib/utils"

function ScrollBar({
    className,
    orientation = "vertical",
    ...props
}: Omit<ScrollAreaPrimitive.Scrollbar.Props, "className"> & {
    className?: string
}) {
    return (
        <ScrollAreaPrimitive.Scrollbar
            data-slot="scroll-area-scrollbar"
            orientation={orientation}
            className={cn(
                "flex touch-none rounded-full opacity-0 transition-opacity delay-300 select-none data-hovering:opacity-100 data-hovering:delay-0 data-scrolling:opacity-100 data-scrolling:delay-0",
                orientation === "vertical"
                    ? "m-1 w-1.5 justify-center"
                    : "m-1 h-1.5 flex-col items-center",
                className
            )}
            {...props}
        >
            <ScrollAreaPrimitive.Thumb
                data-slot="scroll-area-thumb"
                className="rounded-full bg-border-strong"
            />
        </ScrollAreaPrimitive.Scrollbar>
    )
}

function ScrollArea({
    className,
    viewportClassName,
    children,
    orientation = "vertical",
    ...props
}: Omit<ScrollAreaPrimitive.Root.Props, "className"> & {
    className?: string
    viewportClassName?: string
    orientation?: "vertical" | "horizontal" | "both"
}) {
    return (
        <ScrollAreaPrimitive.Root
            data-slot="scroll-area"
            className={cn("relative overflow-hidden", className)}
            {...props}
        >
            <ScrollAreaPrimitive.Viewport
                data-slot="scroll-area-viewport"
                className={cn(
                    "size-full overscroll-contain rounded-[inherit] outline-none focus-visible:ring-3 focus-visible:ring-ring/30",
                    viewportClassName
                )}
            >
                <ScrollAreaPrimitive.Content data-slot="scroll-area-content">
                    {children}
                </ScrollAreaPrimitive.Content>
            </ScrollAreaPrimitive.Viewport>
            {orientation === "vertical" || orientation === "both" ? (
                <ScrollBar orientation="vertical" />
            ) : null}
            {orientation === "horizontal" || orientation === "both" ? (
                <ScrollBar orientation="horizontal" />
            ) : null}
            <ScrollAreaPrimitive.Corner data-slot="scroll-area-corner" />
        </ScrollAreaPrimitive.Root>
    )
}

export { ScrollArea, ScrollBar }
