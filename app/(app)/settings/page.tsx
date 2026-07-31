"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"
import {
    RiLoader4Line,
    RiLogoutBoxRLine,
    RiShieldUserLine,
} from "@remixicon/react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader, SectionHeader } from "@/components/common/section"
import { AccountOverview } from "@/components/settings/account-overview"
import { ProfileForm } from "@/components/settings/profile-form"
import { Button, EmptyState, Skeleton } from "@/components/ui"
import { authClient } from "@/lib/auth/client"
import { useNotificationsStore } from "@/stores/notifications"
import { useSessionStore } from "@/stores/session"

export default function SettingsPage() {
    const router = useRouter()
    const user = useSessionStore((s) => s.user)
    const loading = useSessionStore((s) => s.loading)
    const toast = useNotificationsStore((s) => s.toast)
    const [signingOut, setSigningOut] = React.useState(false)

    async function signOut() {
        setSigningOut(true)
        try {
            await authClient.signOut()
            router.push("/")
            router.refresh()
        } catch (err) {
            setSigningOut(false)
            toast({
                title: "Could not sign out",
                body: err instanceof Error ? err.message : undefined,
                tone: "danger",
            })
        }
    }

    return (
        <PageContainer size="default" className="space-y-8">
            <PageHeader
                eyebrow="Account"
                title="Settings"
                description="Your public identity, account details, and session."
            />

            {!user ? (
                loading ? (
                    <div className="space-y-4">
                        <Skeleton className="h-72 rounded-2xl" />
                        <Skeleton className="h-56 rounded-2xl" />
                    </div>
                ) : (
                    <EmptyState
                        icon={<RiShieldUserLine />}
                        title="Sign in to manage your account"
                        description="Settings are tied to your player account."
                        action={
                            <Button
                                variant="primary"
                                render={<Link href="/auth/login" />}
                            >
                                Sign in
                            </Button>
                        }
                    />
                )
            ) : (
                <div className="space-y-10">
                    <section className="animate-rise-in space-y-4">
                        <SectionHeader
                            title="Profile"
                            description="How other players see you across lobbies and leaderboards."
                        />
                        <ProfileForm user={user} />
                    </section>

                    <section className="animate-rise-in space-y-4">
                        <SectionHeader
                            title="Account"
                            description="Read-only details from sign-in and your custodial wallet."
                        />
                        <AccountOverview user={user} />
                    </section>

                    <section className="animate-rise-in space-y-4">
                        <SectionHeader
                            title="Danger zone"
                            description="Session and account removal."
                        />
                        <div className="space-y-4 rounded-2xl border border-destructive/30 p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                        Sign out
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Ends this session on this device.
                                    </p>
                                </div>
                                <Button
                                    variant="destructive"
                                    onClick={signOut}
                                    disabled={signingOut}
                                >
                                    {signingOut ? (
                                        <RiLoader4Line className="animate-spin" />
                                    ) : (
                                        <RiLogoutBoxRLine />
                                    )}
                                    Sign out
                                </Button>
                            </div>
                            <p className="border-t border-destructive/20 pt-4 text-sm text-muted-foreground">
                                Account deletion is not self-service. Contact
                                support to have your account and custodial
                                wallet closed — withdraw your balance first.
                            </p>
                        </div>
                    </section>
                </div>
            )}
        </PageContainer>
    )
}
