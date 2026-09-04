"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { chainAdapter, type ChainId } from "@/lib/chain"
import { provisionChain } from "@/lib/wallet/provision-chain"
import { useLiveStore } from "@/stores/live"
import {
    useSessionActions,
    useSessionUser,
} from "@/stores/session"

export function RoomChainDialog({ chain }: { chain: ChainId }) {
    const router = useRouter()
    const queryClient = useQueryClient()
    const user = useSessionUser()
    const { setCurrentChain, setBalance } = useSessionActions()
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const label = chainAdapter(chain).label

    async function continueSwitch() {
        if (busy) return
        setBusy(true)
        setError(null)
        try {
            if (user) {
                const balance = await provisionChain(chain)
                setCurrentChain(chain)
                setBalance(balance)
                void queryClient.invalidateQueries({ queryKey: ["activity"] })
                void queryClient.invalidateQueries({
                    queryKey: ["deposit-wallet"],
                })
            } else {
                setCurrentChain(chain)
            }
            useLiveStore.getState().actions.pruneFeedForChain(chain)
            router.refresh()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not switch chain."
            )
            setBusy(false)
        }
    }

    return (
        <Dialog open onOpenChange={() => {}} disablePointerDismissal>
            <DialogContent showCloseButton={false} className="max-w-lg">
                <DialogHeader className="pr-0">
                    <DialogTitle>This lobby is on {label}.</DialogTitle>
                    <DialogDescription>
                        This lobby is on a different chain than the one you
                        selected. Want to switch so you can continue?
                    </DialogDescription>
                </DialogHeader>
                {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <DialogFooter className="flex flex-col gap-2 sm:flex-col sm:items-stretch">
                    <Button
                        className="w-full"
                        variant="primary"
                        disabled={busy}
                        onClick={() => void continueSwitch()}
                    >
                        {busy ? "Switching…" : "Continue"}
                    </Button>
                    <Button
                        variant="ghost"
                        className="w-full text-muted-foreground"
                        disabled={busy}
                        onClick={() => router.push("/lobbies")}
                    >
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
