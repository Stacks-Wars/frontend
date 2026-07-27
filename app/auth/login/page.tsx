"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { GoogleOAuthButton } from "@/components/auth/google-oauth-button"
import { OAuthDivider } from "@/components/auth/oauth-divider"
import { authClient } from "@/lib/auth/client"
import { signInSchema, type SignInFormValues } from "@/lib/auth/schemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: {
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: SignInFormValues) {
        const { error } = await authClient.signIn.email(values)

        if (error) {
            setError("root", {
                message: error.message || "Failed to sign in. Try again.",
            })
            return
        }

        router.push("/games")
        router.refresh()
    }

    return (
        <div className="mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-lg items-center px-4 py-8 sm:px-6">
            <Card className="w-full self-center">
                <CardHeader>
                    <CardTitle className="font-display text-2xl">
                        Log in
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <GoogleOAuthButton callbackURL="/games" />
                    <OAuthDivider />
                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4"
                        noValidate
                    >
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                {...register("email")}
                                type="email"
                                placeholder="you@example.com"
                            />
                            {errors.email ? (
                                <p className="text-sm text-rose-300">
                                    {errors.email.message}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center justify-between gap-3">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <Input
                                id="password"
                                {...register("password")}
                                type="password"
                                placeholder="••••••••"
                            />
                            {errors.password ? (
                                <p className="text-sm text-rose-300">
                                    {errors.password.message}
                                </p>
                            ) : null}
                        </div>
                        {errors.root ? (
                            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">
                                {errors.root.message}
                            </div>
                        ) : null}
                        <Button
                            className="w-full"
                            type="submit"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                    <Separator className="my-4" />
                    <p className="text-center text-sm text-muted-foreground">
                        No account yet?{" "}
                        <Link
                            href="/auth/sign-up"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                            Create one
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
