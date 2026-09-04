"use client"

import * as React from "react"
import { usePathname, useRouter } from "next/navigation"
import { useQueryClient } from "@tanstack/react-query"
import { RiCoinLine, RiFlagLine, RiTrophyLine } from "@remixicon/react"

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

const INTRO_BEATS = [
    {
        text: "Complete your first missions.",
        icon: RiFlagLine,
        tone: "bg-primary/15 text-primary",
    },
    {
        text: "Earn Wars Points.",
        icon: RiCoinLine,
        tone: "bg-gold/15 text-gold",
    },
    {
        text: "Start climbing the leaderboard.",
        icon: RiTrophyLine,
        tone: "bg-primary/15 text-primary",
    },
] as const

export function QuestOnboardingDialog() {
    const pathname = usePathname()
    const router = useRouter()
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
            setError(err instanceof Error ? err.message : "Couldn't skip that.")
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
            setError(err instanceof Error ? err.message : "Couldn't save that.")
        } finally {
            setBusy(false)
        }
    }

    async function finishIntro(goToQuests: boolean) {
        setBusy(true)
        setError(null)
        try {
            const next = await markQuestIntroSeenAction()
            await persistUser(next)
            setForceIntro(false)
            if (goToQuests && pathname !== "/quests") {
                router.push("/quests")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "Couldn't save that.")
        } finally {
            setBusy(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={() => {}} disablePointerDismissal>
            <DialogContent
                showCloseButton={false}
                className={cn(
                    "max-w-lg overflow-hidden",
                    step === "intro" && "border-primary/35"
                )}
            >
                {step === "invite" ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Who invited you?</DialogTitle>
                            <DialogDescription>
                                If someone sent you, type their username so they
                                get credit. Skip if it was just you.
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
                        <DialogHeader className="pr-0">
                            <DialogTitle>Your journey starts here.</DialogTitle>
                            <DialogDescription className="sr-only">
                                Complete your first missions. Earn Wars Points.
                                Start climbing the leaderboard.
                            </DialogDescription>
                        </DialogHeader>
                        <ul className="space-y-3">
                            {INTRO_BEATS.map((beat) => (
                                <li
                                    key={beat.text}
                                    className="flex items-center gap-3 text-sm"
                                >
                                    <span
                                        className={cn(
                                            "grid size-8 shrink-0 place-items-center rounded-lg",
                                            beat.tone
                                        )}
                                    >
                                        <beat.icon className="size-4" />
                                    </span>
                                    {beat.text}
                                </li>
                            ))}
                        </ul>
                        {error ? (
                            <p className="text-sm text-destructive">{error}</p>
                        ) : null}
                        <DialogFooter className="mt-8 flex flex-col gap-2 sm:flex-col sm:items-stretch">
                            <Button
                                className="w-full"
                                variant="primary"
                                disabled={busy}
                                onClick={() => void finishIntro(true)}
                            >
                                Start Quest
                            </Button>
                            <Button
                                variant="ghost"
                                className="w-full text-muted-foreground"
                                disabled={busy}
                                onClick={() => void finishIntro(false)}
                            >
                                Later
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
