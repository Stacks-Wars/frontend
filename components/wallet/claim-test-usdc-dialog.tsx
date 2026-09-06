"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { RiLoader4Line } from "@remixicon/react"

import { Button } from "@/components/ui"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { MICRO } from "@/lib/format"
import { claimTestUsdcOnchain } from "@/lib/onchain"
import { announceTestUsdc } from "@/lib/wallet/announce-test-usdc"
import { useNotificationActions } from "@/stores/notifications"
import {
    useSessionActions,
    useSessionBalance,
    useSessionCurrentChain,
} from "@/stores/session"

export function ClaimTestUsdcDialog({
    open,
    onOpenChange,
}: {
    open: boolean
    onOpenChange: (open: boolean) => void
}) {
    const chain = useSessionCurrentChain()
    const balance = useSessionBalance()
    const { setBalance } = useSessionActions()
    const { toast } = useNotificationActions()
    const queryClient = useQueryClient()
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const tooFunded = (balance?.availableMicro ?? 0) >= MICRO

    React.useEffect(() => {
        if (open && tooFunded) onOpenChange(false)
    }, [open, tooFunded, onOpenChange])

    async function claim() {
        setBusy(true)
        setError(null)
        try {
            const result = await claimTestUsdcOnchain(chain)
            if (!result.ok) {
                setError(result.error)
                return
            }
            setBalance(result.data.balance)
            void queryClient.invalidateQueries({ queryKey: ["activity"] })
            if (result.data.minted) {
                announceTestUsdc(result.data.amountMicro)
            } else {
                toast({
                    title: "Wallet is already funded",
                    body: "Top-up is only for wallets under $1.",
                })
            }
            onOpenChange(false)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not top up."
            )
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog open={open && !tooFunded} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Top up play wallet</DialogTitle>
                    <DialogDescription>
                        We’ll add play tokens so you can join a paid lobby.
                    </DialogDescription>
                </DialogHeader>
                {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={busy}
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        disabled={busy}
                        onClick={() => void claim()}
                    >
                        {busy ? (
                            <RiLoader4Line className="animate-spin" />
                        ) : null}
                        {busy ? "Minting…" : "Top up"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
