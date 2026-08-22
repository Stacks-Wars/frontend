"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { RiCheckLine, RiLoader4Line } from "@remixicon/react"
import { useForm, useWatch } from "react-hook-form"

import { Button, Input, Label } from "@/components/ui"
import { formatUsdc, toMicro, toUsdc } from "@/lib/format"
import { withdrawOnchain } from "@/lib/onchain"
import { hiroExplorerTxUrl } from "@/lib/stacks/explorer"
import { truncateWallet } from "@/lib/utils"
import {
    withdrawMaxUsd,
    withdrawMinUsd,
    withdrawSchema,
    type WithdrawFormValues,
} from "@/lib/wallet/withdraw-schema"
import { useNotificationActions } from "@/stores/notifications"
import { useSessionActions, useSessionBalance } from "@/stores/session"

export function WithdrawForm() {
    const balance = useSessionBalance()
    const { setBalance } = useSessionActions()
    const { toast } = useNotificationActions()
    const queryClient = useQueryClient()

    const [error, setError] = React.useState<string | null>(null)
    const [txid, setTxid] = React.useState<string | null>(null)

    const available = balance?.availableMicro ?? 0
    const schema = React.useMemo(() => withdrawSchema(available), [available])

    const {
        control,
        register,
        handleSubmit,
        setValue,
        formState: { errors, isSubmitting, isValid },
    } = useForm<WithdrawFormValues>({
        resolver: zodResolver(schema),
        defaultValues: { amount: "", address: "" },
        mode: "onChange",
    })

    const amount = useWatch({ control, name: "amount" })
    const parsed = Number.parseFloat(amount)
    const amountUsd = Number.isFinite(parsed) ? Math.max(0, parsed) : 0
    const amountMicro = toMicro(amountUsd)
    const remaining = Math.max(0, available - amountMicro)

    async function onSubmit(values: WithdrawFormValues) {
        setError(null)
        setTxid(null)
        const usd = Number.parseFloat(values.amount)
        const result = await withdrawOnchain({
            amountUsd: usd,
            toAddress: values.address.trim() || undefined,
        })
        if (!result.ok) {
            setError(result.error)
            toast({
                title: "Withdrawal failed",
                body: result.error,
                tone: "danger",
            })
            return
        }
        setBalance(result.data.balance)
        queryClient.setQueryData(["balance"], result.data.balance)
        void queryClient.invalidateQueries({ queryKey: ["activity"] })
        setTxid(result.data.txid)
        setValue("amount", "")
        toast({
            title: "Withdrawal broadcast",
            body: `${formatUsdc(toMicro(usd))} is on its way.`,
            tone: "success",
        })
    }

    return (
        <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
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
                        type="text"
                        inputMode="decimal"
                        autoComplete="off"
                        placeholder="0.00"
                        className="tnum"
                        {...register("amount")}
                        aria-invalid={errors.amount ? true : undefined}
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                            setValue("amount", toUsdc(available).toFixed(2), {
                                shouldValidate: true,
                            })
                        }
                        disabled={available <= 0}
                    >
                        Max
                    </Button>
                </div>
                <p className="tnum text-xs text-muted-foreground">
                    ${withdrawMinUsd} minimum, $
                    {withdrawMaxUsd.toLocaleString("en-US")} maximum per
                    withdrawal. Balance after:{" "}
                    <span className="text-foreground">
                        {formatUsdc(remaining, { zero: "$0.00" })}
                    </span>
                </p>
                {errors.amount ? (
                    <p className="tnum text-xs text-destructive">
                        {errors.amount.message}
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
                    placeholder="SP…"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono text-xs sm:text-sm"
                    {...register("address")}
                    aria-invalid={errors.address ? true : undefined}
                />
                {errors.address ? (
                    <p className="text-xs text-destructive">
                        {errors.address.message}
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

            <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting || !isValid}
            >
                {isSubmitting ? (
                    <RiLoader4Line className="animate-spin" />
                ) : null}
                {amountMicro > 0
                    ? `Withdraw ${formatUsdc(amountMicro)}`
                    : "Withdraw"}
            </Button>
        </form>
    )
}
