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
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<SignInFormValues>({
        resolver: zodResolver(signInSchema),
        defaultValues: { email: "", password: "" },
    })

    async function onSubmit(values: SignInFormValues) {
        const { error } = await authClient.signIn.email(values)
        if (error) {
            setError("root", {
                message: error.message || "Failed to sign in. Try again.",
            })
            return
        }
        router.push("/")
        router.refresh()
    }

    return (
        <div className="w-full">
            <h1 className="font-display text-3xl tracking-tight">Log in</h1>
            <p className="mt-2 text-sm text-muted-foreground">
                Enter the arena.
            </p>
            <div className="mt-8 space-y-4">
                <GoogleOAuthButton callbackURL="/" />
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
                            <p className="text-sm text-destructive">
                                {errors.email.message}
                            </p>
                        ) : null}
                    </div>
                    <div className="grid gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <Label htmlFor="password">Password</Label>
                            <Link
                                href="/auth/forgot-password"
                                className="text-sm text-muted-foreground hover:text-foreground"
                            >
                                Forgot?
                            </Link>
                        </div>
                        <Input
                            id="password"
                            {...register("password")}
                            type="password"
                            placeholder="••••••••"
                        />
                        {errors.password ? (
                            <p className="text-sm text-destructive">
                                {errors.password.message}
                            </p>
                        ) : null}
                    </div>
                    {errors.root ? (
                        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                            {errors.root.message}
                        </p>
                    ) : null}
                    <Button
                        className="w-full"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Signing in…" : "Sign in"}
                    </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    No account?{" "}
                    <Link
                        href="/auth/sign-up"
                        className="font-medium text-foreground hover:underline"
                    >
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}
