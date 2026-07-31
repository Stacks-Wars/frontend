"use client"

import * as React from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"
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
        defaultValues: { email: "" },
    })

    async function onSubmit(values: ForgotPasswordValues) {
        setSuccessMessage(null)
        const { error } = await authClient.requestPasswordReset({
            email: values.email,
            redirectTo: `${window.location.origin}/auth/reset-password`,
        })
        if (error) {
            setError("root", {
                message: error.message || "Could not send reset email.",
            })
            return
        }
        setSuccessMessage("Check your email for a reset link.")
    }

    return (
        <div className="w-full">
            <h1 className="font-display text-3xl tracking-tight">
                Reset password
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
                We will email you a link.
            </p>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="mt-8 space-y-4"
                noValidate
            >
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        {...register("email")}
                    />
                    {errors.email ? (
                        <p className="text-sm text-destructive">
                            {errors.email.message}
                        </p>
                    ) : null}
                </div>
                {errors.root ? (
                    <p className="text-sm text-destructive">
                        {errors.root.message}
                    </p>
                ) : null}
                {successMessage ? (
                    <p className="text-sm text-secondary">{successMessage}</p>
                ) : null}
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Sending…" : "Send link"}
                </Button>
            </form>
            <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link href="/auth/login" className="hover:text-foreground">
                    Back to log in
                </Link>
            </p>
        </div>
    )
}
