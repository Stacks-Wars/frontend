"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { GoogleOAuthButton } from "@/components/auth/google-oauth-button"
import { LegalAgree } from "@/components/auth/legal-agree"
import { OAuthDivider } from "@/components/auth/oauth-divider"
import { VerifyEmailOtp } from "@/components/auth/verify-email-otp"
import { authClient } from "@/lib/auth/client"
import { isVerificationDisabled } from "@/lib/auth/flags"
import { signUpSchema, type SignUpFormValues } from "@/lib/auth/schemas"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignUpPage() {
    const router = useRouter()
    const skipVerification = isVerificationDisabled()
    const [pendingEmail, setPendingEmail] = React.useState<string | null>(null)
    const [agreed, setAgreed] = React.useState(false)
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        reset,
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: { name: "", email: "", password: "" },
    })

    function enterApp() {
        router.push("/")
        router.refresh()
    }

    async function onSubmit(values: SignUpFormValues) {
        if (!agreed) {
            setError("root", {
                message: "Agree to the Terms and Privacy Policy to continue.",
            })
            return
        }
        const { data, error } = await authClient.signUp.email(values)
        if (error) {
            setError("root", {
                message: error.message || "Failed to create account.",
            })
            return
        }

        if (skipVerification) {
            enterApp()
            return
        }

        // Neon Verify-at-Sign-up (code): OTP is emailed; stay on this page until verified.
        if (data?.user && !data.user.emailVerified) {
            setPendingEmail(values.email)
            return
        }

        enterApp()
    }

    if (pendingEmail && !skipVerification) {
        return (
            <VerifyEmailOtp
                email={pendingEmail}
                onVerified={enterApp}
                onBack={() => {
                    setPendingEmail(null)
                    reset({ name: "", email: "", password: "" })
                }}
            />
        )
    }

    return (
        <div className="w-full">
            <h1 className="font-display text-3xl tracking-tight">
                Create account
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
                Join Stacks Wars.
            </p>
            <div className="mt-8 space-y-4">
                <LegalAgree checked={agreed} onCheckedChange={setAgreed} />
                <GoogleOAuthButton callbackURL="/" disabled={!agreed} />
                <OAuthDivider />
                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4"
                    noValidate
                >
                    <div className="grid gap-2">
                        <Label htmlFor="name">Display name</Label>
                        <Input id="name" {...register("name")} />
                        {errors.name ? (
                            <p className="text-sm text-destructive">
                                {errors.name.message}
                            </p>
                        ) : null}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            autoComplete="email"
                            {...register("email")}
                        />
                        {errors.email ? (
                            <p className="text-sm text-destructive">
                                {errors.email.message}
                            </p>
                        ) : null}
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            autoComplete="new-password"
                            {...register("password")}
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
                        disabled={isSubmitting || !agreed}
                    >
                        {isSubmitting ? "Creating…" : "Create account"}
                    </Button>
                </form>
                <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{" "}
                    <Link
                        href="/auth/login"
                        className="font-medium text-foreground hover:underline"
                    >
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    )
}
