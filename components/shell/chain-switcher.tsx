"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import { provisionChain } from "@/lib/wallet/provision-chain"
import { chainAdapter, CHAIN_IDS, type ChainId } from "@/lib/chain"
import { cn } from "@/lib/utils"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui"
import {
    useSessionActions,
    useSessionCurrentChain,
    useSessionNeedsChainPick,
    useSessionUser,
} from "@/stores/session"
import { useLiveStore } from "@/stores/live"

const CHAIN_LABELS: Record<string, string> = Object.fromEntries(
    CHAIN_IDS.map((id) => [id, chainAdapter(id).label])
)

export function ChainSwitcher({
    className,
    variant = "header",
}: {
    className?: string
    variant?: "header" | "nav"
}) {
    const user = useSessionUser()
    const current = useSessionCurrentChain()
    const needsPick = useSessionNeedsChainPick()
    const { setCurrentChain, setBalance } = useSessionActions()
    const router = useRouter()
    const queryClient = useQueryClient()
    const [pending, setPending] = React.useState(false)

    if (!user || needsPick) return null

    async function select(chain: ChainId) {
        if (chain === current || pending) return
        setPending(true)
        setCurrentChain(chain)
        useLiveStore.getState().actions.pruneFeedForChain(chain)
        try {
            const balance = await provisionChain(chain)
            setBalance(balance)
            void queryClient.invalidateQueries({ queryKey: ["activity"] })
            void queryClient.invalidateQueries({ queryKey: ["deposit-wallet"] })
            router.refresh()
        } catch (error) {
            console.error("[chain] switch failed", error)
        } finally {
            setPending(false)
        }
    }

    const selectControl = (
        <Select
            value={current}
            onValueChange={(value) => void select(value as ChainId)}
            items={CHAIN_LABELS}
            disabled={pending}
        >
            <SelectTrigger
                aria-label="Play chain"
                className={cn(
                    variant === "header"
                        ? "h-8 w-29 rounded-full px-2.5 text-xs"
                        : "h-10 w-full rounded-lg text-sm",
                    pending && "opacity-70"
                )}
            >
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {CHAIN_IDS.map((id) => (
                    <SelectItem key={id} value={id}>
                        {chainAdapter(id).label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    )

    if (variant === "nav") {
        return (
            <div className={cn("space-y-1.5 px-3 py-2", className)}>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Chain
                </p>
                {selectControl}
            </div>
        )
    }

    return <div className={className}>{selectControl}</div>
}
