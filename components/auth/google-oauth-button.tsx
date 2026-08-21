"use client"

import * as React from "react"
import { RiGoogleFill, RiLoader4Line } from "@remixicon/react"

import { authClient } from "@/lib/auth/client"
import { Button } from "@/components/ui/button"

type GoogleOAuthButtonProps = {
    callbackURL?: string
    label?: string
    disabled?: boolean
}

export function GoogleOAuthButton({
    callbackURL = "/",
    label = "Continue with Google",
    disabled = false,
}: GoogleOAuthButtonProps) {
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    async function handleGoogleSignIn() {
        setIsLoading(true)
        setError(null)

        try {
            const resolvedCallbackURL = callbackURL.startsWith("http")
                ? callbackURL
                : new URL(callbackURL, window.location.origin).toString()

            const { error: signInError } = await authClient.signIn.social({
                provider: "google",
                callbackURL: resolvedCallbackURL,
                newUserCallbackURL: resolvedCallbackURL,
            })

            if (signInError) {
                throw new Error(signInError.message || "Google sign-in failed.")
            }
        } catch (caughtError) {
            setError(
                caughtError instanceof Error
                    ? caughtError.message
                    : "Google sign-in failed."
            )
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-2">
            <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                disabled={isLoading || disabled}
                onClick={() => void handleGoogleSignIn()}
            >
                {isLoading ? (
                    <RiLoader4Line className="size-4 animate-spin" />
                ) : (
                    <RiGoogleFill className="size-4" />
                )}
                {label}
            </Button>
            {error ? <p className="text-sm text-rose-300">{error}</p> : null}
        </div>
    )
}
