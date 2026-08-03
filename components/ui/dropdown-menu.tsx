"use client"

import { Menu as MenuPrimitive } from "@base-ui/react/menu"
import * as React from "react"

import { playSound } from "@/lib/audio/play-sound"
import { cn } from "@/lib/utils"

function DropdownMenu(props: MenuPrimitive.Root.Props) {
    return <MenuPrimitive.Root data-slot="dropdown-menu" {...props} />
}

function DropdownMenuTrigger({
    onClick,
    ...props
}: Omit<MenuPrimitive.Trigger.Props, "className"> & {
    className?: string
}) {
    return (
        <MenuPrimitive.Trigger
            data-slot="dropdown-menu-trigger"
            {...props}
            onClick={(event) => {
                playSound()
                onClick?.(event)
            }}
        />
    )
}

function DropdownMenuContent({
    className,
    side = "bottom",
    align = "end",
    sideOffset = 8,
    ...props
}: Omit<MenuPrimitive.Popup.Props, "className"> & {
    className?: string
    side?: MenuPrimitive.Positioner.Props["side"]
    align?: MenuPrimitive.Positioner.Props["align"]
    sideOffset?: MenuPrimitive.Positioner.Props["sideOffset"]
}) {
    return (
        <MenuPrimitive.Portal data-slot="dropdown-menu-portal">
            <MenuPrimitive.Positioner
                data-slot="dropdown-menu-positioner"
                className="z-50 outline-none"
                side={side}
                align={align}
                sideOffset={sideOffset}
            >
                <MenuPrimitive.Popup
                    data-slot="dropdown-menu-content"
                    className={cn(
                        "min-w-44 origin-(--transform-origin) overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-xl shadow-black/40 duration-150 outline-none data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                        className
                    )}
                    {...props}
                />
            </MenuPrimitive.Positioner>
        </MenuPrimitive.Portal>
    )
}

function DropdownMenuItem({
    className,
    variant = "default",
    onClick,
    ...props
}: Omit<MenuPrimitive.Item.Props, "className"> & {
    className?: string
    variant?: "default" | "destructive"
}) {
    return (
        <MenuPrimitive.Item
            data-slot="dropdown-menu-item"
            data-variant={variant}
            className={cn(
                "relative flex cursor-default items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none select-none data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-accent data-highlighted:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                variant === "destructive" &&
                    "text-destructive data-highlighted:bg-destructive/15 data-highlighted:text-destructive",
                className
            )}
            {...props}
            onClick={(event) => {
                playSound()
                onClick?.(event)
            }}
        />
    )
}

function DropdownMenuLabel({
    className,
    ...props
}: Omit<MenuPrimitive.GroupLabel.Props, "className"> & {
    className?: string
}) {
    return (
        <MenuPrimitive.GroupLabel
            data-slot="dropdown-menu-label"
            className={cn(
                "px-2.5 py-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase",
                className
            )}
            {...props}
        />
    )
}

function DropdownMenuGroup(
    props: Omit<MenuPrimitive.Group.Props, "className"> & {
        className?: string
    }
) {
    return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />
}

function DropdownMenuSeparator({
    className,
    ...props
}: Omit<MenuPrimitive.Separator.Props, "className"> & {
    className?: string
}) {
    return (
        <MenuPrimitive.Separator
            data-slot="dropdown-menu-separator"
            className={cn("-mx-1 my-1 h-px bg-border", className)}
            {...props}
        />
    )
}

function DropdownMenuShortcut({
    className,
    ...props
}: React.ComponentProps<"span">) {
    return (
        <span
            data-slot="dropdown-menu-shortcut"
            className={cn(
                "tnum ml-auto text-xs tracking-widest text-muted-foreground",
                className
            )}
            {...props}
        />
    )
}

export {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuGroup,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
}
