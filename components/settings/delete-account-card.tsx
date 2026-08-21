"use client"

import { useRouter } from "next/navigation"
import * as React from "react"

import { deleteMyAccount } from "@/actions/users"
import { Button } from "@/components/ui"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { authClient } from "@/lib/auth/client"

export function DeleteAccountCard() {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [block, setBlock] = React.useState<"funds" | "lobby" | null>(null)

    function resetDialog(nextOpen: boolean) {
        setOpen(nextOpen)
        if (!nextOpen) {
            setError(null)
            setBlock(null)
        }
    }

    async function confirm() {
        setBusy(true)
        setError(null)
        setBlock(null)
        try {
            const result = await deleteMyAccount()
            if (!result.ok) {
                if (result.code === "active_match") {
                    setBlock("lobby")
                    setError(
                        "You are in an active lobby. Leave or finish it, then try again."
                    )
                } else {
                    setBlock("funds")
                    setError(
                        "Withdraw your balance and claim any pending winnings first."
                    )
                }
                return
            }
            const client = authClient as typeof authClient & {
                deleteUser?: (args?: Record<string, unknown>) => Promise<unknown>
            }
            if (typeof client.deleteUser === "function") {
                await client.deleteUser({}).catch(() => undefined)
            }
            await authClient.signOut()
            window.location.href = "/"
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not delete account."
            )
        } finally {
            setBusy(false)
        }
    }

    return (
        <div className="space-y-4 rounded-2xl border border-destructive/30 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-sm font-medium">Delete account</p>
                    <p className="text-sm text-muted-foreground">
                        Removes your profile, push devices, and custodial keys.
                        Confirmed on-chain transfers cannot be undone. Withdraw
                        first.
                    </p>
                </div>
                <Button
                    variant="destructive"
                    onClick={() => {
                        setError(null)
                        setBlock(null)
                        setOpen(true)
                    }}
                >
                    Delete account
                </Button>
            </div>

            <Dialog open={open} onOpenChange={resetDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete this account?</DialogTitle>
                        <DialogDescription>
                            This anonymizes your profile and deletes encrypted
                            wallet keys. Match history will show you as a
                            deleted player. You must have a zero balance and no
                            live matches.
                        </DialogDescription>
                    </DialogHeader>
                    {error ? (
                        <p className="text-sm text-destructive">{error}</p>
                    ) : null}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => resetDialog(false)}
                            disabled={busy}
                        >
                            Cancel
                        </Button>
                        {block === "funds" ? (
                            <Button
                                onClick={() => {
                                    resetDialog(false)
                                    router.push("/wallet")
                                }}
                            >
                                Go to wallet
                            </Button>
                        ) : block === "lobby" ? (
                            <Button
                                onClick={() => {
                                    resetDialog(false)
                                    router.push("/lobbies")
                                }}
                            >
                                Go to lobbies
                            </Button>
                        ) : (
                            <Button
                                variant="destructive"
                                onClick={() => void confirm()}
                                disabled={busy}
                            >
                                {busy ? "Deleting…" : "Delete permanently"}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
