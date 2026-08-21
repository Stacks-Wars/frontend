"use client"

import { usePathname } from "next/navigation"
import * as React from "react"

import { acceptLegalTerms } from "@/actions/users"
import { Button } from "@/components/ui"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { LEGAL_VERSION } from "@/lib/legal"
import { useSessionStore } from "@/stores/session"

export function LegalConsentGate() {
    const pathname = usePathname()
    const user = useSessionStore((s) => s.user)
    const setUser = useSessionStore((s) => s.setUser)
    const loading = useSessionStore((s) => s.loading)
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const readingLegal = pathname === "/terms" || pathname === "/privacy"
    const needsAccept = Boolean(
        user &&
            !loading &&
            !readingLegal &&
            (user.legalAcceptedAt == null ||
                user.legalVersion !== LEGAL_VERSION)
    )

    async function accept() {
        setBusy(true)
        setError(null)
        try {
            const next = await acceptLegalTerms(LEGAL_VERSION)
            setUser(next)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not record acceptance."
            )
            setBusy(false)
        }
    }

    return (
        <Dialog
            open={needsAccept}
            onOpenChange={() => {}}
            disablePointerDismissal
        >
            <DialogContent showCloseButton={false} className="max-w-lg">
                <DialogHeader className="pr-0">
                    <DialogTitle>Terms and Privacy</DialogTitle>
                    <DialogDescription>
                        Creating and using an account means you agree to the
                        current Terms of Service and Privacy Policy. Accept to
                        continue, or sign out from the user menu.
                    </DialogDescription>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    Read the{" "}
                    <a
                        href="/terms"
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Terms
                    </a>{" "}
                    and{" "}
                    <a
                        href="/privacy"
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                        target="_blank"
                        rel="noreferrer"
                    >
                        Privacy Policy
                    </a>
                    .
                </p>
                {error ? (
                    <p className="text-sm text-destructive">{error}</p>
                ) : null}
                <DialogFooter>
                    <Button onClick={() => void accept()} disabled={busy}>
                        {busy ? "Saving…" : "I agree"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
