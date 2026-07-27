"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const forgotPasswordSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
})

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>

export default function ForgotPasswordPage() {
    const [successMessage, setSuccessMessage] = React.useState<string | null>(
        null
    )
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<ForgotPasswordValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: "",
        },
    })

    async function onSubmit(values: ForgotPasswordValues) {
        setSuccessMessage(null)

        const redirectTo =
            typeof window !== "undefined"
                ? `${window.location.origin}/auth/reset-password`
                : "/auth/reset-password"

        const { error } = await authClient.requestPasswordReset({
            email: values.email,
            redirectTo,
        })

        if (error) {
            setError("root", {
                message: error.message || "Failed to send reset email.",
            })
            return
        }

        setSuccessMessage(
            "If an account exists for that email, a reset link is on its way."
        )
    }

    return (
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-lg items-center px-4 py-8 sm:px-6">
            <Card className="w-full self-center">
                <CardHeader>
                    <CardTitle>Reset your password</CardTitle>
                    <CardDescription>
                        Enter your email and we&apos;ll send a reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                        noValidate
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@example.com"
                                {...register("email")}
                            />
                            {errors.email ? (
                                <p className="text-sm text-rose-300">
                                    {errors.email.message}
                                </p>
                            ) : null}
                        </div>
                        {errors.root ? (
                            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                                {errors.root.message}
                            </div>
                        ) : null}
                        {successMessage ? (
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
                                {successMessage}
                            </div>
                        ) : null}
                        <Button
                            className="w-full"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Sending..." : "Send reset link"}
                        </Button>
                    </form>
                    <p className="mt-4 text-center text-sm text-muted-foreground">
                        <Link
                            href="/auth/login"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                            Back to login
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
