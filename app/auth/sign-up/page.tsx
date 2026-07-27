"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { GoogleOAuthButton } from "@/components/auth/google-oauth-button"
import { OAuthDivider } from "@/components/auth/oauth-divider"
import { authClient } from "@/lib/auth/client"
import { signUpSchema, type SignUpFormValues } from "@/lib/auth/schemas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function SignUpPage() {
    const router = useRouter()
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<SignUpFormValues>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            name: "",
            email: "",
            password: "",
        },
    })

    async function onSubmit(values: SignUpFormValues) {
        const { error } = await authClient.signUp.email(values)

        if (error) {
            setError("root", {
                message: error.message || "Failed to create account.",
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
                        Create account
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
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                {...register("name")}
                                placeholder="Arena name"
                            />
                            {errors.name ? (
                                <p className="text-sm text-rose-300">
                                    {errors.name.message}
                                </p>
                            ) : null}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="signup-email">Email</Label>
                            <Input
                                id="signup-email"
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
                            <Label htmlFor="signup-password">Password</Label>
                            <Input
                                id="signup-password"
                                {...register("password")}
                                type="password"
                                placeholder="Create a password"
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
                            {isSubmitting
                                ? "Creating account..."
                                : "Create account"}
                        </Button>
                    </form>
                    <Separator className="my-4" />
                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link
                            href="/auth/login"
                            className="font-medium text-foreground underline-offset-4 hover:underline"
                        >
                            Log in
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
