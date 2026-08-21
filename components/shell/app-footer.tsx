"use client"

import Link from "next/link"

import { Brand } from "@/components/shell/brand"
import { Button } from "@/components/ui"

const LINKS = [
    { href: "/games", label: "Games" },
    { href: "/lobbies", label: "Lobbies" },
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
                        Skill-based multiplayer on Stacks. Entry fees are held
                        in an on-chain vault until a match settles.
                    </p>
                </div>
                <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {LINKS.map((link) =>
                        "external" in link && link.external ? (
                            <Button
                                key={link.href}
                                variant="ghost"
                                size="sm"
                                render={
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noreferrer"
                                    />
                                }
                                className="h-auto px-0 py-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                            >
                                {link.label}
                            </Button>
                        ) : (
                            <Button
                                key={link.href}
                                variant="ghost"
                                size="sm"
                                render={<Link href={link.href} />}
                                className="h-auto px-0 py-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                            >
                                {link.label}
                            </Button>
                        )
                    )}
                </nav>
            </div>
        </footer>
    )
}
