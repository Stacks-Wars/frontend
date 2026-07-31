"use client"

import * as React from "react"
import { RiCheckLine, RiFileCopyLine, RiKey2Line } from "@remixicon/react"

import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui"
import { useNotificationsStore } from "@/stores/notifications"
import { useSessionStore } from "@/stores/session"

type GetDeveloperIdProps = {
    /** Profile owner's platform user id (Neon `sub` / `UserId`). */
    userId: string
}

/**
 * Self-only control: opens a dialog so game developers can copy their
 * platform user id for `GameMetadata.dev_id` registration.
 * Hidden for other visitors so the profile stays uncluttered.
 */
export function GetDeveloperId({ userId }: GetDeveloperIdProps) {
    const sessionUserId = useSessionStore((s) => s.user?.id)
    const toast = useNotificationsStore((s) => s.toast)
    const [open, setOpen] = React.useState(false)
    const [copied, setCopied] = React.useState(false)

    if (!sessionUserId || sessionUserId !== userId) {
        return null
    }

    async function copyId() {
        try {
            await navigator.clipboard.writeText(userId)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1600)
            toast({
                title: "Developer ID copied",
                body: "Paste it into your game metadata as dev_id.",
                tone: "success",
            })
        } catch {
            toast({
                title: "Could not copy",
                body: "Select the ID and copy it manually.",
                tone: "danger",
            })
        }
    }

    return (
        <>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={() => setOpen(true)}
            >
                <RiKey2Line className="size-3.5" />
                Get ID
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <RiKey2Line className="size-5 text-primary" />
                            Developer ID
                        </DialogTitle>
                        <DialogDescription>
                            Use this ID as{" "}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                dev_id
                            </code>{" "}
                            when you register a game. It identifies you as the
                            developer for fee payouts. See{" "}
                            <a
                                href="https://docs.stackswars.com/develop/contributing"
                                className="text-foreground underline underline-offset-2"
                                target="_blank"
                                rel="noreferrer"
                            >
                                the developer docs
                            </a>
                            .
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/40 p-3">
                        <code className="tnum min-w-0 flex-1 truncate font-mono text-xs sm:text-sm">
                            {userId}
                        </code>
                        <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            aria-label="Copy developer ID"
                            onClick={() => void copyId()}
                        >
                            {copied ? (
                                <RiCheckLine className="size-4 text-success" />
                            ) : (
                                <RiFileCopyLine className="size-4" />
                            )}
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={() => void copyId().then(() => setOpen(false))}
                        >
                            Copy and close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
