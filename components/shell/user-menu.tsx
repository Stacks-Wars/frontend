"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
    RiLogoutBoxRLine,
    RiSettings3Line,
    RiUser3Line,
    RiWallet3Line,
} from "@remixicon/react"

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui"
import { authClient } from "@/lib/auth/client"
import { displayNameFor, formatUsdc } from "@/lib/format"
import { useSessionStore } from "@/stores/session"

export function UserMenu() {
    const router = useRouter()
    const user = useSessionStore((s) => s.user)
    const balance = useSessionStore((s) => s.balance)
    const loading = useSessionStore((s) => s.loading)

    if (loading && !user) {
        return <span className="size-9 animate-pulse rounded-full bg-muted/60" />
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href="/auth/login" />}
                >
                    Sign in
                </Button>
                <Button
                    variant="primary"
                    size="sm"
                    pill
                    render={<Link href="/auth/sign-up" />}
                >
                    Play now
                </Button>
            </div>
        )
    }

    const name = displayNameFor(user)
    const profileHref = user.username
        ? `/profile/${user.username}`
        : "/settings"

    async function signOut() {
        await authClient.signOut()
        router.push("/")
        router.refresh()
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <button
                        type="button"
                        aria-label="Account"
                        className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                }
            >
                <Avatar size="sm">
                    {user.avatarUrl ? (
                        <AvatarImage src={user.avatarUrl} alt="" />
                    ) : null}
                    <AvatarFallback seed={name} />
                </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-60">
                <div className="px-2.5 py-2">
                    <p className="truncate text-sm font-medium">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                        {user.email}
                    </p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href={profileHref} />}>
                    <RiUser3Line />
                    Profile
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/wallet" />}>
                    <RiWallet3Line />
                    Wallet
                    <span className="tnum ml-auto text-xs text-muted-foreground">
                        {formatUsdc(balance?.availableMicro ?? 0, {
                            zero: "$0.00",
                        })}
                    </span>
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/settings" />}>
                    <RiSettings3Line />
                    Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onClick={signOut}>
                    <RiLogoutBoxRLine />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
