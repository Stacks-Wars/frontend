"use client"

import * as React from "react"
import { RiCheckLine, RiCloseCircleLine, RiLoader4Line } from "@remixicon/react"

import {
    approveJoinRequestAction,
    rejectJoinRequestAction,
} from "@/actions/lobbies"
import { UserChip } from "@/components/common/user-chip"
import { Button } from "@/components/ui"
import type { JoinRequest } from "@/lib/api/types"
import { useNotificationsStore } from "@/stores/notifications"

export function JoinRequestList({
    lobbyId,
    requests,
    disabled,
}: {
    lobbyId: string
    requests: JoinRequest[]
    disabled?: boolean
}) {
    const toast = useNotificationsStore((s) => s.toast)
    const [pending, setPending] = React.useState<string | null>(null)

    const pendingRequests = requests.filter((jr) => jr.state === "pending")
    if (pendingRequests.length === 0) return null

    async function run(
        key: string,
        task: () => Promise<{ ok: boolean; error?: string }>
    ) {
        setPending(key)
        try {
            const result = await task()
            if (!result.ok) {
                toast({
                    title: result.error ?? "Something went wrong",
                    tone: "danger",
                })
            }
        } catch {
            toast({ title: "Network error. Try again.", tone: "danger" })
        } finally {
            setPending(null)
        }
    }

    return (
        <div className="space-y-3 rounded-xl border border-border/70 p-4 surface-raised">
            <p className="text-sm font-medium">Pending join requests</p>
            <div className="grid gap-2">
                {pendingRequests.map((request) => (
                    <div
                        key={request.userId}
                        className="flex items-center gap-3 rounded-lg border border-border/60 p-3"
                    >
                        <UserChip
                            user={request}
                            size="sm"
                            subtitle="Waiting for approval"
                        />
                        <div className="ml-auto flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Approve ${request.username ?? "player"}`}
                                disabled={disabled || pending !== null}
                                onClick={() =>
                                    run(`approve-${request.userId}`, () =>
                                        approveJoinRequestAction(
                                            lobbyId,
                                            request.userId
                                        )
                                    )
                                }
                            >
                                {pending === `approve-${request.userId}` ? (
                                    <RiLoader4Line className="animate-spin" />
                                ) : (
                                    <RiCheckLine className="text-success" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Reject ${request.username ?? "player"}`}
                                disabled={disabled || pending !== null}
                                onClick={() =>
                                    run(`reject-${request.userId}`, () =>
                                        rejectJoinRequestAction(
                                            lobbyId,
                                            request.userId
                                        )
                                    )
                                }
                            >
                                {pending === `reject-${request.userId}` ? (
                                    <RiLoader4Line className="animate-spin" />
                                ) : (
                                    <RiCloseCircleLine className="text-destructive" />
                                )}
                            </Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
