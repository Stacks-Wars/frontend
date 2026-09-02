"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"

import {
    markQuestIntroSeenAction,
    submitReferralAction,
} from "@/actions/quests"
import { checkUsernameAvailableAction } from "@/actions/profile-settings"
import { Button, Input, Label } from "@/components/ui"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { QUESTS_ME_KEY } from "@/hooks/use-quests-me"
import { LEGAL_VERSION } from "@/lib/legal"
import { cn } from "@/lib/utils"
import {
    useSessionActions,
    useSessionLoading,
    useSessionNeedsChainPick,
    useSessionUser,
} from "@/stores/session"

export function QuestOnboardingDialog() {
    const pathname = usePathname()
    const queryClient = useQueryClient()
    const user = useSessionUser()
    const loading = useSessionLoading()
    const needsChain = useSessionNeedsChainPick()
    const { setUser } = useSessionActions()
    const [forceIntro, setForceIntro] = React.useState(false)
    const [username, setUsername] = React.useState("")
    const [busy, setBusy] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    const needsLegal = Boolean(
        user &&
        (user.legalAcceptedAt == null || user.legalVersion !== LEGAL_VERSION)
    )
    const needsReferral = user?.referralPromptStatus === "pending"
    const onAuth = pathname.startsWith("/auth")
    const open = Boolean(
        user &&
        !loading &&
        !needsChain &&
        !needsLegal &&
        !onAuth &&
        (needsReferral || forceIntro)
    )
    const step: "invite" | "intro" = forceIntro ? "intro" : "invite"

    async function persistUser(next: typeof user) {
        if (next) setUser(next)
        void queryClient.invalidateQueries({ queryKey: QUESTS_ME_KEY })
    }

    async function skipInvite() {
        setBusy(true)
        setError(null)
        try {
            setForceIntro(true)
            const next = await submitReferralAction({ skip: true })
            await persistUser(next)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not skip.")
        } finally {
            setBusy(false)
        }
    }

    async function saveInvite() {
        const value = username.trim().toLowerCase()
        if (!value) {
            setError("Enter a username, or skip.")
            return
        }
        setBusy(true)
        setError(null)
        try {
            const check = await checkUsernameAvailableAction(value)
            if (check.reason) {
                setError(check.reason)
                setBusy(false)
                return
            }
            if (check.available) {
                setError("No player with that username.")
                setBusy(false)
                return
            }
            setForceIntro(true)
            const next = await submitReferralAction({ username: value })
            await persistUser(next)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save.")
        } finally {
            setBusy(false)
        }
    }

    async function finishIntro() {
        setBusy(true)
        setError(null)
        try {
            const next = await markQuestIntroSeenAction()
            await persistUser(next)
            setForceIntro(false)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Could not save.")
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => {}} disablePointerDismissal>
            <DialogContent showCloseButton={false} className="max-w-lg">
                {step === "invite" ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Who invited you?</DialogTitle>
                            <DialogDescription>
                                Optional. Enter their username to give them
                                credit.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="referrer-username">Username</Label>
                            <Input
                                id="referrer-username"
                                autoComplete="off"
                                placeholder="their-name"
                                value={username}
                                onChange={(e) =>
                                    setUsername(e.target.value.toLowerCase())
                                }
                            />
                            {error ? (
                                <p className="text-sm text-destructive">
                                    {error}
                                </p>
                            ) : null}
                        </div>
                        <DialogFooter className="gap-2 sm:justify-between">
                            <Button
                                variant="ghost"
                                disabled={busy}
                                onClick={() => void skipInvite()}
                            >
                                Skip
                            </Button>
                            <Button
                                disabled={busy}
                                onClick={() => void saveInvite()}
                            >
                                Continue
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Getting Started</DialogTitle>
                            <DialogDescription>
                                Four steps to get on the board: choose a
                                username, host a match, join someone else, and
                                win once. Claim them on Quests when you are
                                ready.
                            </DialogDescription>
                        </DialogHeader>
                        <ul className="space-y-2 text-sm">
                            {[
                                "Choose your username",
                                "Host your first match",
                                "Join a match",
                                "Win your first match",
                            ].map((item) => (
                                <li
                                    key={item}
                                    className={cn(
                                        "rounded-xl border border-border/60 px-3 py-2"
                                    )}
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : null}
                        <DialogFooter>
                            <Button
                                disabled={busy}
                                onClick={() => void finishIntro()}
                            >
                                Got it
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
