"use client"

import { AddFundsDialog } from "@/components/wallet/add-funds-dialog"
import {
    useFundsActions,
    useFundsAvailableMicro,
    useFundsOpen,
    useFundsRequiredMicro,
} from "@/stores/funds"

export { useAddFunds } from "@/stores/funds"

/** Mounts the add-funds dialog once. Call `useAddFunds().open()` from anywhere. */
export function AddFundsHost() {
    const open = useFundsOpen()
    const requiredMicro = useFundsRequiredMicro()
    const availableMicro = useFundsAvailableMicro()
    const { setOpen } = useFundsActions()

    return (
        <AddFundsDialog
            open={open}
            onOpenChange={setOpen}
            requiredMicro={requiredMicro}
            availableMicro={availableMicro}
        />
    )
}
