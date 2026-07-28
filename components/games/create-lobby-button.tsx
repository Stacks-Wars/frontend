"use client"

import * as React from "react"

import {
    CreateLobbyForm,
    type CreateLobbyGameRef,
} from "@/components/games/create-lobby-form"
import { Button, buttonVariants } from "@/components/ui/button"
import {
    Dialog,
    DialogDescription,
    DialogHeader,
    DialogPopup,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

type ButtonVariantProps = VariantProps<typeof buttonVariants>

export type CreateLobbyButtonProps = {
    game: CreateLobbyGameRef
    children?: React.ReactNode
    className?: string
    variant?: ButtonVariantProps["variant"]
    size?: ButtonVariantProps["size"]
}

/**
 * Reusable trigger that opens the shared create-lobby dialog.
 * Devs can restyle via `className` / `variant` / `children`.
 */
export function CreateLobbyButton({
    game,
    children = "Create Lobby",
    className,
    variant = "primary",
    size = "default",
}: CreateLobbyButtonProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger
                render={
                    <Button
                        variant={variant}
                        size={size}
                        className={cn(className)}
                    />
                }
            >
                {children}
            </DialogTrigger>
            <DialogPopup>
                <DialogHeader>
                    <DialogTitle>Create lobby</DialogTitle>
                    <DialogDescription>
                        Start a free {game.name} lobby. No entry fee.
                    </DialogDescription>
                </DialogHeader>
                <CreateLobbyForm
                    game={game}
                    onCreated={() => setOpen(false)}
                />
            </DialogPopup>
        </Dialog>
    )
}
