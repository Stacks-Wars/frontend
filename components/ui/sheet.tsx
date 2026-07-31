"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { RiCloseLine } from "@remixicon/react"
import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const sheetViewportVariants = cva("fixed inset-0 z-50 flex", {
    variants: {
        side: {
            right: "justify-end",
            bottom: "items-end justify-center",
        },
    },
    defaultVariants: {
        side: "right",
    },
})

const sheetPopupVariants = cva(
    "flex flex-col overflow-y-auto shadow-2xl shadow-black/50 duration-300 outline-none surface-raised data-closed:animate-out data-open:animate-in",
    {
        variants: {
            side: {
                right: "h-full w-full max-w-sm rounded-l-2xl border-l border-border data-closed:slide-out-to-right data-open:slide-in-from-right",
                bottom: "max-h-[85svh] w-full rounded-t-2xl border-t border-border data-closed:slide-out-to-bottom data-open:slide-in-from-bottom",
            },
        },
        defaultVariants: {
            side: "right",
        },
    }
)

function Sheet(props: DialogPrimitive.Root.Props) {
    return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger(
    props: Omit<DialogPrimitive.Trigger.Props, "className"> & {
        className?: string
    }
) {
    return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose(
    props: Omit<DialogPrimitive.Close.Props, "className"> & {
        className?: string
    }
) {
    return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetContent({
    className,
    children,
    side = "right",
    showCloseButton = true,
    ...props
}: Omit<DialogPrimitive.Popup.Props, "className"> &
    VariantProps<typeof sheetPopupVariants> & {
        className?: string
        showCloseButton?: boolean
    }) {
    return (
        <DialogPrimitive.Portal data-slot="sheet-portal">
            <DialogPrimitive.Backdrop
                data-slot="sheet-backdrop"
                className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0"
            />
            <DialogPrimitive.Viewport
                data-slot="sheet-viewport"
                className={sheetViewportVariants({ side })}
            >
                <DialogPrimitive.Popup
                    data-slot="sheet-content"
                    className={cn(sheetPopupVariants({ side, className }))}
                    {...props}
                >
                    {children}
                    {showCloseButton ? (
                        <DialogPrimitive.Close
                            data-slot="sheet-close"
                            render={
                                <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    className="absolute top-4 right-4 text-muted-foreground"
                                    aria-label="Close"
                                />
                            }
                        >
                            <RiCloseLine />
                        </DialogPrimitive.Close>
                    ) : null}
                </DialogPrimitive.Popup>
            </DialogPrimitive.Viewport>
        </DialogPrimitive.Portal>
    )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-header"
            className={cn(
                "flex flex-col gap-1.5 border-b border-border/60 p-6 pr-14",
                className
            )}
            {...props}
        />
    )
}

function SheetBody({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-body"
            className={cn("flex-1 overflow-y-auto p-6", className)}
            {...props}
        />
    )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="sheet-footer"
            className={cn(
                "mt-auto flex flex-col-reverse gap-2 border-t border-border/60 p-6 sm:flex-row sm:justify-end",
                className
            )}
            {...props}
        />
    )
}

function SheetTitle({
    className,
    ...props
}: Omit<DialogPrimitive.Title.Props, "className"> & { className?: string }) {
    return (
        <DialogPrimitive.Title
            data-slot="sheet-title"
            className={cn("font-display text-lg", className)}
            {...props}
        />
    )
}

function SheetDescription({
    className,
    ...props
}: Omit<DialogPrimitive.Description.Props, "className"> & {
    className?: string
}) {
    return (
        <DialogPrimitive.Description
            data-slot="sheet-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
}

export {
    Sheet,
    SheetTrigger,
    SheetClose,
    SheetContent,
    SheetHeader,
    SheetBody,
    SheetFooter,
    SheetTitle,
    SheetDescription,
    sheetPopupVariants,
}
