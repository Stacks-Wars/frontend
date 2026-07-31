"use client"

import Link from "next/link"
import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import {
    RiArrowRightUpLine,
    RiCheckLine,
    RiFileCopyLine,
    RiWallet3Line,
} from "@remixicon/react"

import { getMyDepositWallet } from "@/actions/wallet"
import { Badge, Button, Skeleton } from "@/components/ui"
import type { AppUser } from "@/lib/api/types"
import { formatDate, shortId } from "@/lib/format"
import { truncateWallet } from "@/lib/utils"
import { useNotificationsStore } from "@/stores/notifications"

export function AccountOverview({ user }: { user: AppUser }) {
    const toast = useNotificationsStore((s) => s.toast)
    const [copied, setCopied] = React.useState(false)

    const {
        data: wallet,
        isLoading,
        error,
    } = useQuery({
        queryKey: ["deposit-wallet"],
        queryFn: getMyDepositWallet,
        staleTime: 10 * 60_000,
    })

    async function copyAddress(address: string) {
        try {
            await navigator.clipboard.writeText(address)
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1600)
        } catch {
            toast({
                title: "Could not copy",
                body: "Select the address and copy it manually.",
                tone: "danger",
            })
        }
    }

    return (
        <div className="divide-y divide-border/60 rounded-2xl border border-border/70 surface-raised">
            <Row label="Email">
                <span className="truncate text-sm">{user.email}</span>
                {user.emailVerifiedAt ? (
                    <Badge variant="success">Verified</Badge>
                ) : (
                    <Badge variant="warning">Unverified</Badge>
                )}
            </Row>

            <Row label="Account ID">
                <span className="tnum font-mono text-sm">
                    {shortId(user.id)}
                </span>
            </Row>

            <Row label="Custodial address">
                {isLoading ? (
                    <Skeleton className="h-5 w-32" />
                ) : wallet ? (
                    <>
                        <span className="font-mono text-sm">
                            {truncateWallet(wallet.stxAddress)}
                        </span>
                        <Badge variant="outline">{wallet.network}</Badge>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Copy custodial address"
                            onClick={() => void copyAddress(wallet.stxAddress)}
                        >
                            {copied ? (
                                <RiCheckLine className="text-success" />
                            ) : (
                                <RiFileCopyLine />
                            )}
                        </Button>
                    </>
                ) : (
                    <span className="text-sm text-destructive">
                        {error instanceof Error
                            ? error.message
                            : "No custodial wallet yet."}
                    </span>
                )}
            </Row>

            <Row label="Joined">
                <span className="tnum text-sm">
                    {formatDate(user.createdAt)}
                </span>
            </Row>

            <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                {user.username ? (
                    <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/profile/${user.username}`} />}
                    >
                        <RiArrowRightUpLine />
                        Public profile
                    </Button>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        Claim a username above to get a public profile.
                    </span>
                )}
                <Button
                    variant="ghost"
                    size="sm"
                    render={<Link href="/wallet" />}
                >
                    <RiWallet3Line />
                    Wallet
                </Button>
            </div>
        </div>
    )
}

function Row({
    label,
    children,
}: {
    label: string
    children: React.ReactNode
}) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="flex min-w-0 items-center gap-2">{children}</span>
        </div>
    )
}
