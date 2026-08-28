"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { Badge, Button } from "@/components/ui"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { chainAdapter, CHAIN_IDS, type ChainId } from "@/lib/chain"
import { LEGAL_VERSION } from "@/lib/legal"
import { cn } from "@/lib/utils"
import { provisionChain } from "@/lib/wallet/provision-chain"
import {
    useSessionActions,
    useSessionLoading,
    useSessionNeedsChainPick,
    useSessionUser,
} from "@/stores/session"

const COPY: Record<ChainId, string> = {
    solana: "Play with USDC on Solana. New wallets get $50 on Devnet.",
    stacks: "Play with USDCx on Stacks.",
}

export function ChainOnboardingDialog() {
    const pathname = usePathname()
    const router = useRouter()
    const queryClient = useQueryClient()
    const user = useSessionUser()
    const loading = useSessionLoading()
    const needsPick = useSessionNeedsChainPick()
    const { setCurrentChain, setBalance, setNeedsChainPick } =
        useSessionActions()
    const [selected, setSelected] = React.useState<ChainId>("solana")
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const onAuth = pathname.startsWith("/auth")
    const needsLegal = Boolean(
        user &&
        (user.legalAcceptedAt == null || user.legalVersion !== LEGAL_VERSION)
    )
    const open = Boolean(
        user && !loading && needsPick && !needsLegal && !onAuth
    )

    async function confirm() {
        setBusy(true)
        setError(null)
        try {
            setCurrentChain(selected)
            const balance = await provisionChain(selected)
            setBalance(balance)
            setNeedsChainPick(false)
            void queryClient.invalidateQueries({ queryKey: ["activity"] })
            void queryClient.invalidateQueries({
                queryKey: ["deposit-wallet"],
            })
            router.refresh()
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not set up that chain."
            )
            setBusy(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => {}} disablePointerDismissal>
            <DialogContent showCloseButton={false} className="max-w-lg">
                <DialogHeader className="pr-0">
                    <DialogTitle>Choose a chain</DialogTitle>
                    <DialogDescription>
                        Games and lobbies are grouped by network. You can switch
                        later.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-2">
                    {CHAIN_IDS.map((id) => {
                        const active = selected === id
                        return (
                            <button
                                key={id}
                                type="button"
                                disabled={busy}
                                onClick={() => setSelected(id)}
                                className={cn(
                                    "rounded-2xl border px-4 py-3 text-left transition-colors",
                                    active
                                        ? "border-primary bg-primary/10"
                                        : "border-border/70 hover:border-border-strong"
                                )}
                                aria-pressed={active}
                            >
                                <span className="flex items-center justify-between gap-3">
                                    <span className="font-display text-lg">
                                        {chainAdapter(id).label}
                                    </span>
                                    {id === "solana" ? (
                                        <Badge variant="warning">Devnet</Badge>
                                    ) : (
                                        <Badge variant="outline">
                                            {chainAdapter(id).playToken}
                                        </Badge>
                                    )}
                                </span>
                                <span className="mt-1 block text-sm text-muted-foreground">
                                    {COPY[id]}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                ) : null}

                <DialogFooter>
                    <Button
                        type="button"
                        variant="primary"
                        disabled={busy}
                        onClick={() => void confirm()}
                    >
                        {busy ? "Setting up…" : "Continue"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
