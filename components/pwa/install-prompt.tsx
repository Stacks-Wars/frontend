"use client"

import * as React from "react"
import { RiCloseLine, RiShareForwardLine } from "@remixicon/react"

import { Button } from "@/components/ui"
import {
    useInstallActions,
    useInstallDismissed,
    useInstallEligible,
} from "@/stores/install"

export function InstallPrompt() {
    const eligible = useInstallEligible()
    const dismissed = useInstallDismissed()
    const { evaluate, dismiss } = useInstallActions()

    React.useEffect(() => {
        evaluate()
    }, [evaluate])

    if (!eligible || dismissed) return null

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-4">
            <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-border/70 p-4 shadow-xl surface-raised">
                <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                        <RiShareForwardLine className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-sm font-medium">
                            Install Stacks Wars
                        </p>
                        <p className="text-xs text-muted-foreground">
                            Tap Share, then Add to Home Screen. Push alerts on
                            iPhone need the installed app.
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Dismiss"
                        onClick={dismiss}
                    >
                        <RiCloseLine />
                    </Button>
                </div>
            </div>
        </div>
    )
}
