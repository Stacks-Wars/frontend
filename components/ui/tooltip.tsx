"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

function TooltipProvider({
    delay = 300,
    closeDelay = 0,
    ...props
}: TooltipPrimitive.Provider.Props) {
    return (
        <TooltipPrimitive.Provider
            delay={delay}
            closeDelay={closeDelay}
            {...props}
        />
    )
}

function Tooltip(props: TooltipPrimitive.Root.Props) {
    return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

function TooltipTrigger(
    props: Omit<TooltipPrimitive.Trigger.Props, "className"> & {
        className?: string
    }
) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
}

function TooltipContent({
    className,
    side = "top",
    align = "center",
    sideOffset = 8,
    showArrow = true,
    children,
    ...props
}: Omit<TooltipPrimitive.Popup.Props, "className"> & {
    className?: string
    side?: TooltipPrimitive.Positioner.Props["side"]
    align?: TooltipPrimitive.Positioner.Props["align"]
    sideOffset?: TooltipPrimitive.Positioner.Props["sideOffset"]
    showArrow?: boolean
}) {
    return (
        <TooltipPrimitive.Portal data-slot="tooltip-portal">
            <TooltipPrimitive.Positioner
                data-slot="tooltip-positioner"
                className="z-50 outline-none"
                side={side}
                align={align}
                sideOffset={sideOffset}
            >
                <TooltipPrimitive.Popup
                    data-slot="tooltip-content"
                    className={cn(
                        "relative max-w-64 origin-(--transform-origin) rounded-lg border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-lg shadow-black/40 duration-150 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                        className
                    )}
                    {...props}
                >
                    {showArrow ? (
                        <TooltipPrimitive.Arrow
                            data-slot="tooltip-arrow"
                            className="relative block h-1.5 w-3 overflow-clip before:absolute before:bottom-0 before:left-1/2 before:size-[calc(6px*sqrt(2))] before:[transform:translate(-50%,50%)_rotate(45deg)] before:border before:border-border before:bg-popover before:content-[''] data-[side=bottom]:top-[-6px] data-[side=left]:right-[-9px] data-[side=left]:rotate-90 data-[side=right]:left-[-9px] data-[side=right]:-rotate-90 data-[side=top]:bottom-[-6px] data-[side=top]:rotate-180"
                        />
                    ) : null}
                    {children}
                </TooltipPrimitive.Popup>
            </TooltipPrimitive.Positioner>
        </TooltipPrimitive.Portal>
    )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
