"use client"

import { Brand } from "@/components/shell/brand"
import { ButtonLink } from "@/components/ui"

const LINKS = [
    { href: "/games", label: "Games" },
    { href: "/lobbies", label: "Lobbies" },
    { href: "/quests", label: "Quests" },
    { href: "/leaderboard", label: "Leaderboard" },
    { href: "/terms", label: "Terms" },
    { href: "/privacy", label: "Privacy" },
    { href: "https://docs.stackswars.com", label: "Docs", external: true },
    { href: "https://t.me/stackswars", label: "Telegram", external: true },
]

export function AppFooter() {
    return (
        <footer className="mt-20 border-t border-border/60">
            <div className="mx-auto flex w-full max-w-350 flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                <div className="space-y-2">
                    <Brand />
                    <p className="text-xs text-muted-foreground">
                        Onchain multiplayer on Stacks Wars. Entry fees sit in a
                        vault until the match settles.
                    </p>
                </div>
                <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {LINKS.map((link) => (
                        <ButtonLink
                            key={link.href}
                            href={link.href}
                            variant="ghost"
                            size="sm"
                            className="h-auto px-0 py-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                            {...("external" in link && link.external
                                ? { target: "_blank", rel: "noreferrer" }
                                : {})}
                        >
                            {link.label}
                        </ButtonLink>
                    ))}
                </nav>
            </div>
        </footer>
    )
}
