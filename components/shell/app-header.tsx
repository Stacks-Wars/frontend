"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"
import { RiMenuLine } from "@remixicon/react"

import { BalancePill } from "@/components/shell/balance-pill"
import { Brand } from "@/components/shell/brand"
import { ConnectionPill } from "@/components/shell/connection-pill"
import { LiveTicker } from "@/components/shell/live-ticker"
import { NotificationsMenu } from "@/components/shell/notifications-menu"
import { UserMenu } from "@/components/shell/user-menu"
import {
    Button,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui"
import { cn } from "@/lib/utils"
import { useSessionStore } from "@/stores/session"

const NAV = [
    { href: "/games", label: "Games" },
    { href: "/lobbies", label: "Lobbies" },
    { href: "/leaderboard", label: "Leaderboard" },
]

function isActive(pathname: string, href: string): boolean {
    return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppHeader() {
    const pathname = usePathname()
    const [menuOpen, setMenuOpen] = React.useState(false)
    const user = useSessionStore((s) => s.user)

    const closeMenu = () => setMenuOpen(false)

    return (
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-full max-w-350 items-center gap-4 px-4 sm:px-6 lg:px-8">
                <Brand />

                <nav className="hidden items-center gap-1 md:flex">
                    {NAV.map((item) => (
                        <Button
                            key={item.href}
                            variant="ghost"
                            size="sm"
                            render={<Link href={item.href} />}
                            className={cn(
                                "relative h-auto rounded-lg px-3 py-2 text-sm font-medium hover:bg-transparent",
                                isActive(pathname, item.href)
                                    ? "text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.label}
                            {isActive(pathname, item.href) ? (
                                <span className="absolute inset-x-3 -bottom-px h-px bg-primary" />
                            ) : null}
                        </Button>
                    ))}
                </nav>

                <div className="ml-auto flex items-center gap-2 sm:gap-3">
                    <LiveTicker className="hidden lg:inline-flex" />
                    <ConnectionPill />
                    {user ? (
                        <>
                            <BalancePill />
                            <NotificationsMenu />
                        </>
                    ) : null}
                    <UserMenu />
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Menu"
                        className="md:hidden"
                        onClick={() => setMenuOpen(true)}
                    >
                        <RiMenuLine />
                    </Button>
                </div>
            </div>

            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetContent side="right" className="max-w-xs">
                    <SheetHeader>
                        <SheetTitle>Navigate</SheetTitle>
                    </SheetHeader>
                    <SheetBody className="flex flex-col gap-1">
                        {NAV.map((item) => (
                            <Button
                                key={item.href}
                                variant="ghost"

                                render={<Link href={item.href} />}
                                onClick={closeMenu}
                                className={cn(
                                    "h-auto justify-start rounded-lg px-3 py-2.5 text-sm font-medium",
                                    isActive(pathname, item.href)
                                        ? "bg-muted text-foreground"
                                        : "text-muted-foreground hover:bg-muted/60"
                                )}
                            >
                                {item.label}
                            </Button>
                        ))}
                        {user ? (
                            <>
                                <Button
                                    variant="ghost"
                                    render={<Link href="/wallet" />}
                                    onClick={closeMenu}
                                    className="h-auto justify-start rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/60"
                                >
                                    Wallet
                                </Button>
                                <Button
                                    variant="ghost"
                                    render={<Link href="/settings" />}
                                    onClick={closeMenu}
                                    className="h-auto justify-start rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/60"
                                >
                                    Settings
                                </Button>
                            </>
                        ) : null}
                        <LiveTicker className="mt-4 self-start" />
                    </SheetBody>
                </SheetContent>
            </Sheet>
        </header>
    )
}
