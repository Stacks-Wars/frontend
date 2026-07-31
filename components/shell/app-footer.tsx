import Link from "next/link"

import { Brand } from "@/components/shell/brand"

const LINKS = [
    { href: "/games", label: "Games" },
    { href: "/lobbies", label: "Lobbies" },
    { href: "/leaderboard", label: "Leaderboard" },
]

export function AppFooter() {
    return (
        <footer className="mt-20 border-t border-border/60">
            <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
                <div className="space-y-2">
                    <Brand />
                    <p className="text-xs text-muted-foreground">
                        Skill-based multiplayer on Stacks. Entry fees are held in
                        an on-chain vault until a match settles.
                    </p>
                </div>
                <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
                    {LINKS.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </div>
        </footer>
    )
}
