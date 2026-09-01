"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { authClient } from "@/lib/auth/client"
import { Button, buttonVariants } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

const resetPasswordSchema = z
    .object({
        password: z.string().min(8, "Password must be at least 8 characters."),
        confirmPassword: z.string().min(1, "Confirm your password."),
    })
    .refine((values) => values.password === values.confirmPassword, {
        message: "Passwords do not match.",
        path: ["confirmPassword"],
    })

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>

function ResetPasswordForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const token = searchParams.get("token") ?? searchParams.get("code") ?? ""
    const [successMessage, setSuccessMessage] = React.useState<string | null>(
        null
    )
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<ResetPasswordValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: "",
            confirmPassword: "",
        },
    })

    async function onSubmit(values: ResetPasswordValues) {
        setSuccessMessage(null)

        if (!token) {
            setError("root", {
                message:
                    "Reset token is missing. Request a new link from the forgot password page.",
            })
            return
        }

        const { error } = await authClient.resetPassword({
            newPassword: values.password,
            token,
        })

        if (error) {
            setError("root", {
                message: error.message || "Failed to reset password.",
            })
            return
        }

        setSuccessMessage("Password updated. You can sign in now.")
        window.setTimeout(() => {
            router.push("/auth/login")
            router.refresh()
        }, 1200)
    }

    return (
        <div className="w-full">
            <Card className="w-full">
                <CardHeader>
                    <CardTitle>Set a new password</CardTitle>
                    <CardDescription>
                        Choose a new password for your Stacks Wars account.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {!token ? (
                        <div className="space-y-4">
                            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                                This reset link is invalid or expired.
                            </div>
                            <Link
                                href="/auth/forgot-password"
                                className={cn(
                                    buttonVariants(),
                                    "inline-flex w-full justify-center"
                                )}
                            >
                                Request new reset link
                            </Link>
                        </div>
                    ) : (
                        <form
                            onSubmit={handleSubmit(onSubmit)}
                            className="space-y-4"
                            noValidate
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">
                                    New password
                                </Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("password")}
                                />
                                {errors.password ? (
                                    <p className="text-sm text-rose-300">
                                        {errors.password.message}
                                    </p>
                                ) : null}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="confirm-password">
                                    Confirm password
                                </Label>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="••••••••"
                                    {...register("confirmPassword")}
                                />
                                {errors.confirmPassword ? (
                                    <p className="text-sm text-rose-300">
                                        {errors.confirmPassword.message}
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
                                {isSubmitting
                                    ? "Updating..."
                                    : "Update password"}
                            </Button>
                        </form>
                    )}
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

export default function ResetPasswordPage() {
    return (
        <React.Suspense
            fallback={
                <div className="w-full">
                    <Card className="w-full">
                        <CardHeader className="space-y-2">
                            <Skeleton className="h-7 w-44" />
                            <Skeleton className="h-4 w-full" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                            <div className="grid gap-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                            <Skeleton className="h-10 w-full rounded-lg" />
                            <Skeleton className="mx-auto h-4 w-24" />
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <ResetPasswordForm />
        </React.Suspense>
    )
}
