"use client"

import * as React from "react"
import { RiAlertLine, RiRefreshLine } from "@remixicon/react"

import { Button, ButtonLink } from "@/components/ui"

export default function AppError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    React.useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <main className="grid min-h-svh place-items-center bg-grid px-4">
            <div className="max-w-md space-y-5 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-destructive/40 bg-destructive/10 text-destructive">
                    <RiAlertLine />
                </span>
                <h1 className="font-display text-3xl">That didn&apos;t load</h1>
                <p className="text-muted-foreground">
                    Something broke on our side. Trying again usually works.
                </p>
                {error.digest ? (
                    <p className="font-mono text-xs text-muted-foreground">
                        {error.digest}
                    </p>
                ) : null}
                <div className="flex justify-center gap-2">
                    <Button variant="primary" onClick={reset}>
                        <RiRefreshLine />
                        Try again
                    </Button>
                    <ButtonLink href="/" variant="outline">
                        Home
                    </ButtonLink>
                </div>
            </div>
        </main>
    )
}
