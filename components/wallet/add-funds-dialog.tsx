"use client"

import * as React from "react"
import { RiWallet3Line } from "@remixicon/react"

import { DepositPanel } from "@/components/wallet/deposit-panel"
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui"
import { mintsPlayTokens } from "@/lib/chain"
import { depositFundsLead, depositFundsWarn } from "@/lib/wallet/deposit-copy"
import { formatUsdc } from "@/lib/format"
import { useSessionCurrentChain } from "@/stores/session"

export type AddFundsDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    /** Entry (or other) amount the user is short for. */
    requiredMicro?: number
    availableMicro?: number
}

export function AddFundsDialog({
    open,
    onOpenChange,
    requiredMicro = 0,
    availableMicro = 0,
}: AddFundsDialogProps) {
    const chain = useSessionCurrentChain()
    const shortfall = Math.max(0, requiredMicro - availableMicro)
    const showShortfall = requiredMicro > 0 && shortfall > 0

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <RiWallet3Line className="size-5 text-primary" />
                        Add funds
                    </DialogTitle>
                    <DialogDescription>
                        {showShortfall
                            ? `You need ${formatUsdc(requiredMicro)} to join, but only have ${formatUsdc(availableMicro, { zero: "$0.00" })}. ${
                                  mintsPlayTokens(chain)
                                      ? "Your play wallet will be topped up, then try again."
                                      : `Deposit at least ${formatUsdc(shortfall)} more, then try again.`
                              }`
                            : mintsPlayTokens(chain)
                              ? "Paid lobbies take entry from this play wallet."
                              : `${depositFundsLead(chain)} ${depositFundsWarn(chain)}`}
                    </DialogDescription>
                </DialogHeader>

                <DepositPanel />

                <DialogFooter>
                    <Button
                        type="button"
                        variant="primary"
                        onClick={() => onOpenChange(false)}
                    >
                        Done
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
