"use client"

import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { Button } from "@/components/ui"
import { useSessionStore } from "@/stores/session"

export function ClosingCta() {
    const user = useSessionStore((s) => s.user)

    return (
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-grid px-6 py-14 text-center sm:px-10">
            <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent" />
            <div className="relative mx-auto max-w-xl space-y-5">
                <h2 className="font-display text-3xl sm:text-4xl">
                    {user ? "Your lobby is waiting" : "Pick a game, take a seat"}
                </h2>
                <p className="text-muted-foreground">
                    Free lobbies cost nothing to try. Paid ones settle on-chain
                    the moment the match ends.
                </p>
                <div className="flex flex-wrap justify-center gap-3">
                    {user ? (
                        <CreateLobbyButton size="lg" withIcon={false}>
                            Host a lobby
                        </CreateLobbyButton>
                    ) : (
                        <Button
                            size="lg"
                            variant="primary"
                            render={<Link href="/auth/sign-up" />}
                        >
                            Create an account
                            <RiArrowRightLine />
                        </Button>
                    )}
                    <Button
                        size="lg"
                        variant="outline"
                        render={<Link href="/lobbies" />}
                    >
                        Browse lobbies
                    </Button>
                </div>
            </div>
        </section>
    )
}
