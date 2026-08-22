"use client"

import { RiShieldUserLine } from "@remixicon/react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader, SectionHeader } from "@/components/common/section"
import { AccountOverview } from "@/components/settings/account-overview"
import { DeleteAccountCard } from "@/components/settings/delete-account-card"
import { NotificationPreferences } from "@/components/settings/notification-preferences"
import { ProfileForm } from "@/components/settings/profile-form"
import { SoundPreferences } from "@/components/settings/sound-preferences"
import { ButtonLink, EmptyState, Skeleton } from "@/components/ui"
import { useSessionLoading, useSessionUser } from "@/stores/session"

export default function SettingsPage() {
    const user = useSessionUser()
    const loading = useSessionLoading()

    return (
        <PageContainer size="default" className="space-y-8">
            <PageHeader
                eyebrow="Account"
                title="Settings"
                description="Your public identity, sound, account details, and session."
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
                            <ButtonLink href="/auth/login" variant="primary">
                                Sign in
                            </ButtonLink>
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
                            title="Sound"
                            description="Background music and effect levels for the arena."
                        />
                        <SoundPreferences />
                    </section>

                    <section className="animate-rise-in space-y-4">
                        <SectionHeader
                            title="Notifications"
                            description="Device push for match results, winnings, and new lobbies."
                        />
                        <NotificationPreferences />
                    </section>

                    <section className="animate-rise-in space-y-4">
                        <SectionHeader
                            title="Danger zone"
                            description="Permanent account removal. Sign out lives on the user menu."
                        />
                        <DeleteAccountCard />
                    </section>
                </div>
            )}
        </PageContainer>
    )
}
