"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/store/user"

const links = [
    { href: "/games", label: "Games" },
    { href: "/lobby", label: "Lobby" },
    { href: "/leaderboard", label: "Leaderboard" },
]

export function Header() {
    const pathname = usePathname()
    const user = useUserStore((state) => state.user)
    const loading = useUserStore((state) => state.loading)

    return (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-8">
                    <Link
                        href="/"
                        className="font-display text-xl tracking-tight text-foreground transition-colors hover:text-secondary"
                    >
                        Stacks Wars
                    </Link>
                    <nav className="hidden items-center gap-1 md:flex">
                        {links.map((link) => {
                            const active = pathname.startsWith(link.href)
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                                        active
                                            ? "bg-primary/20 text-foreground"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    {link.label}
                                </Link>
                            )
                        })}
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    {loading ? (
                        <div className="h-9 w-28 animate-pulse rounded-full bg-muted" />
                    ) : user ? (
                        <Link
                            href={`/u/${user.id}`}
                            className={cn(
                                buttonVariants({ variant: "outline" })
                            )}
                        >
                            {user.displayName || user.email}
                        </Link>
                    ) : (
                        <>
                            <Link
                                href="/auth/login"
                                className={cn(
                                    buttonVariants({ variant: "ghost" })
                                )}
                            >
                                Log in
                            </Link>
                            <Link
                                href="/auth/sign-up"
                                className={cn(buttonVariants())}
                            >
                                Enter Arena
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
