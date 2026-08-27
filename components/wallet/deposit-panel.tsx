"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { RiCheckLine, RiFileCopyLine, RiLoader4Line } from "@remixicon/react"

import { getMyDepositWallet, refreshMyBalance } from "@/actions/wallet"
import { ClaimTestUsdcDialog } from "@/components/wallet/claim-test-usdc-dialog"
import { Badge, Button, Skeleton } from "@/components/ui"
import { chainAdapter } from "@/lib/chain"
import { MICRO } from "@/lib/format"
import { useNotificationActions } from "@/stores/notifications"
import {
    useSessionActions,
    useSessionBalance,
    useSessionCurrentChain,
} from "@/stores/session"

export function DepositPanel() {
    const { setBalance } = useSessionActions()
    const { toast } = useNotificationActions()
    const chain = useSessionCurrentChain()
    const balance = useSessionBalance()
    const token = chainAdapter(chain).playToken
    const [copied, setCopied] = React.useState(false)
    const [checking, setChecking] = React.useState(false)
    const [claimOpen, setClaimOpen] = React.useState(false)

    const {
        data: wallet,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["deposit-wallet", chain],
        queryFn: () => getMyDepositWallet(chain),
        staleTime: 10 * 60_000,
    })

    async function copyAddress(address: string) {
        try {
            await navigator.clipboard.writeText(address)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1600)
        } catch {
            toast({
                title: "Could not copy",
                body: "Select the address and copy it manually.",
                tone: "danger",
            })
        }
    }

    async function check() {
        setChecking(true)
        try {
            const next = await refreshMyBalance(chain)
            setBalance(next)
            toast({ title: "Balance re-read from chain", tone: "success" })
        } catch (err) {
            toast({
                title: "Could not check for the deposit",
                body: err instanceof Error ? err.message : undefined,
                tone: "danger",
            })
        } finally {
            setChecking(false)
        }
    }

    function onGetUsdc() {
        const available = balance?.availableMicro ?? 0
        if (available >= MICRO) {
            toast({
                title: "You already have test USDC",
                body: "The claim is only for wallets under $1.",
            })
            return
        }
        setClaimOpen(true)
    }

    if (chain === "solana") {
        return (
            <div className="space-y-4 rounded-2xl border border-border/70 p-5 surface-raised">
                <p className="text-sm text-muted-foreground">
                    Don&apos;t send any tokens here, including Circle USDC.
                    Matches use our own minted USDC on Devnet.
                </p>
                <Button type="button" variant="primary" onClick={onGetUsdc}>
                    Get USDC for Stacks Wars Devnet
                </Button>
                {wallet ? (
                    <p className="text-xs text-muted-foreground">
                        Play wallet{" "}
                        <code className="font-mono break-all">
                            {wallet.address}
                        </code>
                        <Badge variant="outline" className="ml-2">
                            {wallet.network}
                        </Badge>
                    </p>
                ) : isLoading ? (
                    <Skeleton className="h-8 rounded-xl" />
                ) : error ? (
                    <p className="text-sm text-destructive">
                        {error instanceof Error
                            ? error.message
                            : "No Solana wallet yet."}
                    </p>
                ) : null}
                <ClaimTestUsdcDialog
                    open={claimOpen}
                    onOpenChange={setClaimOpen}
                />
            </div>
        )
    }

    return (
        <div className="space-y-4 rounded-2xl border border-border/70 p-5 surface-raised">
            <p className="text-sm text-muted-foreground">
                {token} sent to the address below credits this account. The
                balance updates once the transfer confirms on-chain.
            </p>

            {isLoading ? (
                <Skeleton className="h-16 rounded-xl" />
            ) : wallet ? (
                <>
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/40 px-3 py-3">
                        <code className="font-mono text-xs break-all select-all sm:text-sm">
                            {wallet.address}
                        </code>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Copy deposit address"
                            onClick={() => void copyAddress(wallet.address)}
                        >
                            {copied ? (
                                <RiCheckLine className="text-success" />
                            ) : (
                                <RiFileCopyLine />
                            )}
                        </Button>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={check}
                            disabled={checking}
                        >
                            {checking ? (
                                <RiLoader4Line className="animate-spin" />
                            ) : null}
                            I&apos;ve sent it
                        </Button>
                        <Badge variant="outline">{wallet.network}</Badge>
                        <span className="text-xs text-muted-foreground">
                            {token} only. Other tokens are not credited.
                        </span>
                    </div>
                </>
            ) : (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error instanceof Error
                        ? error.message
                        : "No custodial wallet is provisioned for this account yet."}
                </p>
            )}
        </div>
    )
}
