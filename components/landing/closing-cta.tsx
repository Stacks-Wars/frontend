"use client"

import { RiArrowRightLine } from "@remixicon/react"

import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { ButtonLink } from "@/components/ui"
import { useSessionUser } from "@/stores/session"

export function ClosingCta() {
    const user = useSessionUser()

    return (
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-grid px-6 py-14 text-center sm:px-10">
            <div className="absolute inset-0 bg-linear-to-t from-primary/10 to-transparent" />
            <div className="relative mx-auto max-w-xl space-y-5">
                <h2 className="font-display text-3xl sm:text-4xl">
                    {user
                        ? "Your lobby is waiting"
                        : "Pick a game, take a seat"}
                </h2>
                <p className="text-muted-foreground">
                    Free lobbies cost nothing to try. Paid ones settle on-chain
                    when the match ends.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    {user ? (
                        <CreateLobbyButton size="lg" withIcon={false}>
                            Host a lobby
                        </CreateLobbyButton>
                    ) : (
                        <ButtonLink
                            href="/auth/sign-up"
                            size="lg"
                            variant="primary"
                        >
                            Create an account
                            <RiArrowRightLine />
                        </ButtonLink>
                    )}
                    <ButtonLink href="/lobbies" size="lg" variant="outline">
                        Browse lobbies
                    </ButtonLink>
                </div>
            </div>
        </section>
    )
}
