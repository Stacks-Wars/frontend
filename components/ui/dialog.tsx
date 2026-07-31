"use client"

import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { RiCloseLine } from "@remixicon/react"
import * as React from "react"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function Dialog(props: DialogPrimitive.Root.Props) {
    return <DialogPrimitive.Root data-slot="dialog" {...props} />
}

function DialogTrigger(
    props: Omit<DialogPrimitive.Trigger.Props, "className"> & {
        className?: string
    }
) {
    return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />
}

function DialogPortal(props: DialogPrimitive.Portal.Props) {
    return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />
}

function DialogClose(
    props: Omit<DialogPrimitive.Close.Props, "className"> & {
        className?: string
    }
) {
    return <DialogPrimitive.Close data-slot="dialog-close" {...props} />
}

function DialogBackdrop({
    className,
    ...props
}: Omit<DialogPrimitive.Backdrop.Props, "className"> & {
    className?: string
}) {
    return (
        <DialogPrimitive.Backdrop
            data-slot="dialog-backdrop"
            className={cn(
                "fixed inset-0 z-50 bg-background/70 backdrop-blur-sm data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0",
                className
            )}
            {...props}
        />
    )
}

function DialogContent({
    className,
    children,
    showCloseButton = true,
    ...props
}: Omit<DialogPrimitive.Popup.Props, "className"> & {
    className?: string
    showCloseButton?: boolean
}) {
    return (
        <DialogPortal>
            <DialogBackdrop />
            <DialogPrimitive.Viewport
                data-slot="dialog-viewport"
                className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-4 sm:items-center"
            >
                <DialogPrimitive.Popup
                    data-slot="dialog-content"
                    className={cn(
                        "relative m-auto w-full max-w-md rounded-2xl border border-border p-6 shadow-2xl shadow-black/50 outline-none surface-raised data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
                        className
                    )}
                    {...props}
                >
                    {children}
                    {showCloseButton ? (
                        <DialogPrimitive.Close
                            data-slot="dialog-close"
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
        </DialogPortal>
    )
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-header"
            className={cn("mb-5 flex flex-col gap-1.5 pr-10", className)}
            {...props}
        />
    )
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
    return (
        <div
            data-slot="dialog-footer"
            className={cn(
                "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
                className
            )}
            {...props}
        />
    )
}

function DialogTitle({
    className,
    ...props
}: Omit<DialogPrimitive.Title.Props, "className"> & { className?: string }) {
    return (
        <DialogPrimitive.Title
            data-slot="dialog-title"
            className={cn("font-display text-xl", className)}
            {...props}
        />
    )
}

function DialogDescription({
    className,
    ...props
}: Omit<DialogPrimitive.Description.Props, "className"> & {
    className?: string
}) {
    return (
        <DialogPrimitive.Description
            data-slot="dialog-description"
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
        />
    )
}

export {
    Dialog,
    DialogTrigger,
    DialogPortal,
    DialogClose,
    DialogBackdrop,
    DialogContent,
    DialogContent as DialogPopup,
    DialogHeader,
    DialogFooter,
    DialogTitle,
    DialogDescription,
}
