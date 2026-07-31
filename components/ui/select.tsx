"use client"

import { Select as SelectPrimitive } from "@base-ui/react/select"
import { RiCheckLine, RiExpandUpDownLine } from "@remixicon/react"

import { cn } from "@/lib/utils"

function Select<Value, Multiple extends boolean | undefined = false>(
    props: SelectPrimitive.Root.Props<Value, Multiple>
) {
    return <SelectPrimitive.Root data-slot="select" {...props} />
}

function SelectTrigger({
    className,
    children,
    ...props
}: Omit<SelectPrimitive.Trigger.Props, "className"> & { className?: string }) {
    return (
        <SelectPrimitive.Trigger
            data-slot="select-trigger"
            className={cn(
                "flex h-10 w-full items-center justify-between gap-2 rounded-lg border border-border bg-input px-3 text-sm whitespace-nowrap transition-colors outline-none select-none hover:border-border-strong focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/25 data-disabled:cursor-not-allowed data-disabled:opacity-50 data-popup-open:border-border-strong [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        >
            {children}
            <SelectPrimitive.Icon
                data-slot="select-icon"
                className="text-muted-foreground"
            >
                <RiExpandUpDownLine className="size-4" />
            </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    )
}

function SelectValue({
    className,
    ...props
}: Omit<SelectPrimitive.Value.Props, "className"> & { className?: string }) {
    return (
        <SelectPrimitive.Value
            data-slot="select-value"
            className={cn(
                "truncate text-left data-placeholder:text-muted-foreground",
                className
            )}
            {...props}
        />
    )
}

function SelectContent({
    className,
    children,
    side = "bottom",
    align = "start",
    sideOffset = 6,
    alignItemWithTrigger = false,
    ...props
}: Omit<SelectPrimitive.Popup.Props, "className"> & {
    className?: string
    side?: SelectPrimitive.Positioner.Props["side"]
    align?: SelectPrimitive.Positioner.Props["align"]
    sideOffset?: SelectPrimitive.Positioner.Props["sideOffset"]
    alignItemWithTrigger?: boolean
}) {
    return (
        <SelectPrimitive.Portal data-slot="select-portal">
            <SelectPrimitive.Positioner
                data-slot="select-positioner"
                className="z-50 outline-none"
                side={side}
                align={align}
                sideOffset={sideOffset}
                alignItemWithTrigger={alignItemWithTrigger}
            >
                <SelectPrimitive.Popup
                    data-slot="select-content"
                    className={cn(
                        "max-h-(--available-height) min-w-(--anchor-width) origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl shadow-black/40 duration-150 outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                        className
                    )}
                    {...props}
                >
                    <SelectPrimitive.List
                        data-slot="select-list"
                        className="max-h-(--available-height) overflow-y-auto"
                    >
                        {children}
                    </SelectPrimitive.List>
                </SelectPrimitive.Popup>
            </SelectPrimitive.Positioner>
        </SelectPrimitive.Portal>
    )
}

function SelectItem({
    className,
    children,
    ...props
}: Omit<SelectPrimitive.Item.Props, "className"> & { className?: string }) {
    return (
        <SelectPrimitive.Item
            data-slot="select-item"
            className={cn(
                "relative flex cursor-default items-center gap-2 rounded-lg py-2 pr-8 pl-2.5 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                className
            )}
            {...props}
        >
            <SelectPrimitive.ItemText data-slot="select-item-text">
                {children}
            </SelectPrimitive.ItemText>
            <SelectPrimitive.ItemIndicator
                data-slot="select-item-indicator"
                className="absolute right-2.5 flex items-center text-primary"
            >
                <RiCheckLine className="size-4" />
            </SelectPrimitive.ItemIndicator>
        </SelectPrimitive.Item>
    )
}

function SelectGroup(
    props: Omit<SelectPrimitive.Group.Props, "className"> & {
        className?: string
    }
) {
    return <SelectPrimitive.Group data-slot="select-group" {...props} />
}

function SelectGroupLabel({
    className,
    ...props
}: Omit<SelectPrimitive.GroupLabel.Props, "className"> & {
    className?: string
}) {
    return (
        <SelectPrimitive.GroupLabel
            data-slot="select-group-label"
            className={cn(
                "px-2.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                className
            )}
            {...props}
        />
    )
}

function SelectSeparator({
    className,
    ...props
}: Omit<SelectPrimitive.Separator.Props, "className"> & {
    className?: string
}) {
    return (
        <SelectPrimitive.Separator
            data-slot="select-separator"
            className={cn("-mx-1 my-1 h-px bg-border", className)}
            {...props}
        />
    )
}

export {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
    SelectGroup,
    SelectGroupLabel,
    SelectSeparator,
}
