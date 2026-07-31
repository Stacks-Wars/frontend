"use client"

import * as React from "react"

import { AddFundsDialog } from "@/components/wallet/add-funds-dialog"

type OpenAddFundsOptions = {
    requiredMicro?: number
    availableMicro?: number
}

type AddFundsContext = {
    open: (options?: OpenAddFundsOptions) => void
}

const Context = React.createContext<AddFundsContext | null>(null)

export function AddFundsProvider({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = React.useState(false)
    const [requiredMicro, setRequiredMicro] = React.useState(0)
    const [availableMicro, setAvailableMicro] = React.useState(0)

    const value = React.useMemo<AddFundsContext>(
        () => ({
            open: (options) => {
                setRequiredMicro(options?.requiredMicro ?? 0)
                setAvailableMicro(options?.availableMicro ?? 0)
                setOpen(true)
            },
        }),
        []
    )

    return (
        <Context.Provider value={value}>
            {children}
            <AddFundsDialog
                open={open}
                onOpenChange={setOpen}
                requiredMicro={requiredMicro}
                availableMicro={availableMicro}
            />
        </Context.Provider>
    )
}

export function useAddFunds(): AddFundsContext {
    const context = React.useContext(Context)
    if (!context) {
        throw new Error("useAddFunds must be used inside AddFundsProvider")
    }
    return context
}
