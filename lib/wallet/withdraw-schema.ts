import { z } from "zod"

import { chainAdapter, type ChainId } from "@/lib/chain"
import { toMicro, toUsdc } from "@/lib/format"
import { MAX_WITHDRAW_MICRO, MIN_WITHDRAW_MICRO } from "@/lib/vault/config"

const MIN_USD = toUsdc(MIN_WITHDRAW_MICRO)
const MAX_USD = toUsdc(MAX_WITHDRAW_MICRO)

export const withdrawMinUsd = MIN_USD
export const withdrawMaxUsd = MAX_USD

export function withdrawSchema(availableMicro: number, chain: ChainId) {
    const adapter = chainAdapter(chain)
    return z.object({
        amount: z
            .string()
            .trim()
            .min(1, "Enter an amount.")
            .refine(
                (value) => Number.isFinite(Number.parseFloat(value)),
                "Enter a valid amount."
            )
            .refine((value) => {
                const micro = toMicro(Number.parseFloat(value))
                return micro >= MIN_WITHDRAW_MICRO
            }, `Minimum withdrawal is $${MIN_USD}.`)
            .refine((value) => {
                const micro = toMicro(Number.parseFloat(value))
                return micro <= MAX_WITHDRAW_MICRO
            }, `Maximum withdrawal is $${MAX_USD.toLocaleString("en-US")}.`)
            .refine((value) => {
                const micro = toMicro(Number.parseFloat(value))
                return micro <= availableMicro
            }, "That is more than your available balance."),
        address: z
            .string()
            .trim()
            .min(1, "Enter a destination address.")
            .refine(
                (value) => adapter.parseAddress(value) !== null,
                `That does not look like a ${adapter.label} address.`
            ),
    })
}

export type WithdrawFormValues = z.infer<ReturnType<typeof withdrawSchema>>
