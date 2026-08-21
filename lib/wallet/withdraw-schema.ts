import { z } from "zod"

import { toMicro, toUsdc } from "@/lib/format"
import { MAX_WITHDRAW_MICRO, MIN_WITHDRAW_MICRO } from "@/lib/vault/config"

const MIN_USD = toUsdc(MIN_WITHDRAW_MICRO)
const MAX_USD = toUsdc(MAX_WITHDRAW_MICRO)
const STACKS_ADDRESS = /^S[0-9A-Z]{25,60}$/

export const withdrawMinUsd = MIN_USD
export const withdrawMaxUsd = MAX_USD

export function withdrawSchema(availableMicro: number) {
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
            .refine(
                (value) =>
                    value.length === 0 ||
                    STACKS_ADDRESS.test(value.toUpperCase()),
                "That does not look like a Stacks address."
            ),
    })
}

export type WithdrawFormValues = z.infer<ReturnType<typeof withdrawSchema>>
