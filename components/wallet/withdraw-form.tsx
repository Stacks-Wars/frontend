"use client"

import * as React from "react"
import { useQueryClient } from "@tanstack/react-query"
import { RiCheckLine, RiLoader4Line } from "@remixicon/react"

import { withdrawAction } from "@/actions/wallet"
import { Button, Input, Label } from "@/components/ui"
import { formatUsdc, toMicro, toUsdc } from "@/lib/format"
import { hiroExplorerTxUrl } from "@/lib/stacks/explorer"
import { truncateWallet } from "@/lib/utils"
import { MAX_WITHDRAW_MICRO, MIN_WITHDRAW_MICRO } from "@/lib/vault/config"
import { useNotificationsStore } from "@/stores/notifications"
import { useSessionStore } from "@/stores/session"

const MIN_USD = toUsdc(MIN_WITHDRAW_MICRO)
const MAX_USD = toUsdc(MAX_WITHDRAW_MICRO)
const STACKS_ADDRESS = /^S[0-9A-Z]{25,60}$/

export function WithdrawForm() {
    const balance = useSessionStore((s) => s.balance)
    const setBalance = useSessionStore((s) => s.setBalance)
    const toast = useNotificationsStore((s) => s.toast)
    const queryClient = useQueryClient()

    const [amount, setAmount] = React.useState("")
    const [address, setAddress] = React.useState("")
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [txid, setTxid] = React.useState<string | null>(null)

    const available = balance?.availableMicro ?? 0
    const parsed = Number.parseFloat(amount)
    const amountUsd = Number.isFinite(parsed) ? Math.max(0, parsed) : 0
    const amountMicro = toMicro(amountUsd)

    const trimmedAddress = address.trim()
    const addressInvalid =
        trimmedAddress.length > 0 &&
        !STACKS_ADDRESS.test(trimmedAddress.toUpperCase())
    const belowMinimum = amountMicro > 0 && amountMicro < MIN_WITHDRAW_MICRO
    const aboveMaximum = amountMicro > MAX_WITHDRAW_MICRO
    const exceedsBalance = amountMicro > available
    const remaining = Math.max(0, available - amountMicro)

    const disabled =
        submitting ||
        amountMicro <= 0 ||
        belowMinimum ||
        aboveMaximum ||
        exceedsBalance ||
        addressInvalid

    async function submit(event: React.FormEvent) {
        event.preventDefault()
        if (disabled) return

        setSubmitting(true)
        setError(null)
        setTxid(null)
        try {
            const result = await withdrawAction({
                amountUsd,
                toAddress: trimmedAddress || undefined,
            })
            setBalance(result.balance)
            queryClient.setQueryData(["balance"], result.balance)
            void queryClient.invalidateQueries({ queryKey: ["activity"] })
            setTxid(result.txid)
            setAmount("")
            toast({
                title: "Withdrawal broadcast",
                body: `${formatUsdc(amountMicro)} is on its way.`,
                tone: "success",
            })
        } catch (err) {
            const message =
                err instanceof Error ? err.message : "The withdrawal failed."
            setError(message)
            toast({ title: "Withdrawal failed", body: message, tone: "danger" })
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-border/70 p-5 surface-raised"
        >
            <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="withdraw-amount">Amount (USD)</Label>
                    <span className="tnum text-xs text-muted-foreground">
                        Available {formatUsdc(available, { zero: "$0.00" })}
                    </span>
                </div>
                <div className="flex gap-2">
                    <Input
                        id="withdraw-amount"
                        type="number"
                        inputMode="decimal"
                        min={MIN_USD}
                        max={MAX_USD}
                        step="0.5"
                        value={amount}
                        onChange={(event) => setAmount(event.target.value)}
                        placeholder="0.00"
                        className="tnum"
                        aria-invalid={
                            belowMinimum || aboveMaximum || exceedsBalance
                                ? true
                                : undefined
                        }
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => setAmount(toUsdc(available).toFixed(2))}
                        disabled={available <= 0}
                    >
                        Max
                    </Button>
                </div>
                <p className="tnum text-xs text-muted-foreground">
                    ${MIN_USD} minimum, ${MAX_USD.toLocaleString("en-US")}{" "}
                    maximum per withdrawal. Balance after:{" "}
                    <span className="text-foreground">
                        {formatUsdc(remaining, { zero: "$0.00" })}
                    </span>
                </p>
                {belowMinimum ? (
                    <p className="tnum text-xs text-destructive">
                        Minimum withdrawal is ${MIN_USD}.
                    </p>
                ) : null}
                {aboveMaximum ? (
                    <p className="tnum text-xs text-destructive">
                        Maximum withdrawal is ${MAX_USD.toLocaleString("en-US")}
                        .
                    </p>
                ) : null}
                {exceedsBalance ? (
                    <p className="text-xs text-destructive">
                        That is more than your available balance.
                    </p>
                ) : null}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="withdraw-address">
                    Destination address
                    <span className="ml-1 text-xs font-normal text-muted-foreground">
                        optional
                    </span>
                </Label>
                <Input
                    id="withdraw-address"
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    placeholder="SP…"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono text-xs sm:text-sm"
                    aria-invalid={addressInvalid ? true : undefined}
                />
                {addressInvalid ? (
                    <p className="text-xs text-destructive">
                        That does not look like a Stacks address.
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Defaults to your linked wallet.
                    </p>
                )}
            </div>

            {error ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            ) : null}

            {txid ? (
                <p className="flex items-center gap-2 rounded-lg border border-success/40 bg-success/10 px-3 py-2 text-sm text-success">
                    <RiCheckLine className="size-4" />
                    Broadcast as{" "}
                    <a
                        href={hiroExplorerTxUrl(txid)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono underline-offset-2 hover:underline"
                    >
                        {truncateWallet(txid)}
                    </a>
                </p>
            ) : null}

            <Button type="submit" variant="primary" disabled={disabled}>
                {submitting ? <RiLoader4Line className="animate-spin" /> : null}
                {amountMicro > 0
                    ? `Withdraw ${formatUsdc(amountMicro)}`
                    : "Withdraw"}
            </Button>
        </form>
    )
}
