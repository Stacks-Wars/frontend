"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const tabsListVariants = cva("group/tabs-list flex items-center", {
    variants: {
        variant: {
            underline: "relative gap-1 border-b border-border",
            pill: "w-fit gap-1 rounded-xl border border-border bg-surface p-1",
        },
    },
    defaultVariants: {
        variant: "underline",
    },
})

const tabsTriggerClassName =
    "relative inline-flex h-9 shrink-0 cursor-default items-center justify-center gap-2 px-3 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors outline-none select-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 data-active:text-foreground data-disabled:pointer-events-none data-disabled:opacity-50 group-data-[variant=pill]/tabs-list:rounded-lg group-data-[variant=pill]/tabs-list:data-active:bg-accent group-data-[variant=pill]/tabs-list:data-active:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"

function Tabs({
    className,
    ...props
}: Omit<TabsPrimitive.Root.Props, "className"> & { className?: string }) {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            className={cn("flex flex-col gap-4", className)}
            {...props}
        />
    )
}

function TabsList({
    className,
    variant = "underline",
    children,
    ...props
}: Omit<TabsPrimitive.List.Props, "className"> &
    VariantProps<typeof tabsListVariants> & { className?: string }) {
    return (
        <TabsPrimitive.List
            data-slot="tabs-list"
            data-variant={variant}
            className={cn(tabsListVariants({ variant, className }))}
            {...props}
        >
            {children}
            {variant === "underline" ? (
                <TabsPrimitive.Indicator
                    data-slot="tabs-indicator"
                    className="absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) rounded-full bg-primary transition-[translate,width] duration-200 ease-out"
                />
            ) : null}
        </TabsPrimitive.List>
    )
}

function TabsTrigger({
    className,
    ...props
}: Omit<TabsPrimitive.Tab.Props, "className"> & { className?: string }) {
    return (
        <TabsPrimitive.Tab
            data-slot="tabs-trigger"
            className={cn(tabsTriggerClassName, className)}
            {...props}
        />
    )
}

function TabsContent({
    className,
    ...props
}: Omit<TabsPrimitive.Panel.Props, "className"> & { className?: string }) {
    return (
        <TabsPrimitive.Panel
            data-slot="tabs-content"
            className={cn("outline-none", className)}
            {...props}
        />
    )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
