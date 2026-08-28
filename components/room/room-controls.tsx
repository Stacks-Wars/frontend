"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { RiFlagLine, RiLoader4Line, RiLogoutBoxRLine, RiPlayFill } from "@remixicon/react"

import {
    readyLobbyAction,
    requestJoinLobbyAction,
    startLobbyAction,
} from "@/actions/lobbies"
import { Button } from "@/components/ui"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useAddFunds } from "@/stores/funds"
import type { GameMetadata, JoinRequest, Lobby, PlayerState } from "@/lib/api/types"
import { formatUsdc } from "@/lib/format"
import { joinLobbyOnchain, leaveLobbyOnchain } from "@/lib/onchain"
import { useNotificationActions } from "@/stores/notifications"
import { useSessionBalance } from "@/stores/session"

type Pending = "join" | "request" | "leave" | "ready" | "start" | null

export function RoomControls({
    lobby,
    players,
    joinRequests,
    selfUserId,
    game,
    onForfeit,
}: {
    lobby: Lobby
    players: PlayerState[]
    joinRequests: JoinRequest[]
    selfUserId: string | null
    game?: GameMetadata | null
    onForfeit?: () => void
}) {
    const router = useRouter()
    const { toast } = useNotificationActions()
    const balance = useSessionBalance()
    const { open: openAddFunds } = useAddFunds()
    const [pending, setPending] = React.useState<Pending>(null)
    const [forfeitOpen, setForfeitOpen] = React.useState(false)

    const me = players.find((player) => player.userId === selfUserId)
    const isCreator = selfUserId === lobby.creatorId
    const capacity = game?.maxPlayers ?? players.length + 1
    const full = players.length >= capacity
    const missing = Math.max(0, (game?.minPlayers ?? 2) - players.length)
    // The host readies up implicitly when they hit start.
    const guestsReady = players.every(
        (player) => player.ready || player.userId === selfUserId
    )

    const myRequest = joinRequests.find((jr) => jr.userId === selfUserId)
    const isJoinRequestPending = myRequest?.state === "pending"
    const isJoinRequestAccepted = myRequest?.state === "accepted"
    const needsJoinRequest =
        lobby.isPrivate &&
        !me &&
        selfUserId !== lobby.creatorId &&
        !isJoinRequestAccepted

    /** Paid join cost for this seat (sponsored guests pay nothing). */
    const joinCostMicro =
        lobby.entryAmountMicro > 0 && !lobby.isSponsored
            ? lobby.entryAmountMicro
            : 0
    const availableMicro = balance?.availableMicro ?? 0

    function ensureFundsForJoin(): boolean {
        if (joinCostMicro <= availableMicro) return true
        openAddFunds({
            requiredMicro: joinCostMicro,
            availableMicro,
        })
        return false
    }

    async function run(
        kind: Exclude<Pending, null>,
        task: () => Promise<{ ok: boolean; error?: string }>
    ) {
        setPending(kind)
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

    if (!selfUserId) {
        return (
            <p className="text-sm text-muted-foreground">
                Sign in to take a seat.
            </p>
        )
    }

    if (lobby.status === "inProgress" || lobby.status === "starting") {
        if (!me || !onForfeit) return null
        const stakeMicro =
            lobby.entryAmountMicro <= 0
                ? 0
                : lobby.isSponsored && selfUserId !== lobby.creatorId
                  ? 0
                  : lobby.entryAmountMicro
        return (
            <>
                <Button variant="destructive" onClick={() => setForfeitOpen(true)}>
                    <RiFlagLine />
                    Forfeit
                </Button>
                <Dialog open={forfeitOpen} onOpenChange={setForfeitOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Forfeit this match?</DialogTitle>
                            <DialogDescription>
                                You will lose the match
                                {stakeMicro > 0
                                    ? `, the wars points for a win, and your ${formatUsdc(stakeMicro)} stake. The pot goes to your opponent.`
                                    : " and the wars points for a win."}
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <Button
                                variant="outline"
                                onClick={() => setForfeitOpen(false)}
                            >
                                Stay in the match
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => {
                                    setForfeitOpen(false)
                                    onForfeit()
                                }}
                            >
                                Forfeit
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    if (lobby.status === "finished") return null

    return (
        <div className="flex flex-wrap items-center gap-2">
            {!me ? (
                needsJoinRequest ? (
                    <Button
                        variant="primary"
                        size="lg"
                        disabled={
                            full ||
                            pending !== null ||
                            isJoinRequestPending
                        }
                        onClick={() =>
                            run("request", () =>
                                requestJoinLobbyAction(lobby.id)
                            )
                        }
                    >
                        {pending === "request" ? (
                            <RiLoader4Line className="animate-spin" />
                        ) : null}
                        {isJoinRequestPending
                            ? "Request pending"
                            : "Request to join"}
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        size="lg"
                        disabled={full || pending !== null}
                        onClick={() => {
                            if (!ensureFundsForJoin()) return
                            run("join", () => joinLobbyOnchain(lobby.id))
                        }}
                    >
                        {pending === "join" ? (
                            <RiLoader4Line className="animate-spin" />
                        ) : null}
                        {full
                            ? "Lobby full"
                            : joinCostMicro > 0
                              ? `Join · ${formatUsdc(joinCostMicro)}`
                              : "Join lobby"}
                    </Button>
                )
            ) : (
                <>
                    {!isCreator ? (
                        <Button
                            variant={me.ready ? "outline" : "primary"}
                            size="lg"
                            disabled={pending !== null}
                            onClick={() =>
                                run("ready", () =>
                                    readyLobbyAction(lobby.id, !me.ready)
                                )
                            }
                        >
                            {pending === "ready" ? (
                                <RiLoader4Line className="animate-spin" />
                            ) : null}
                            {me.ready ? "Not ready" : "I'm ready"}
                        </Button>
                    ) : null}

                    {isCreator ? (
                        <Button
                            variant="gold"
                            size="lg"
                            disabled={
                                missing > 0 || !guestsReady || pending !== null
                            }
                            onClick={() =>
                                run("start", () => startLobbyAction(lobby.id))
                            }
                        >
                            {pending === "start" ? (
                                <RiLoader4Line className="animate-spin" />
                            ) : (
                                <RiPlayFill />
                            )}
                            {missing > 0
                                ? `Need ${missing} more`
                                : guestsReady
                                  ? "Start match"
                                  : "Waiting on players"}
                        </Button>
                    ) : null}

                    <Button
                        variant="ghost"
                        disabled={pending !== null}
                        onClick={() => {
                            void (async () => {
                                setPending("leave")
                                try {
                                    const result = await leaveLobbyOnchain(
                                        lobby.id
                                    )
                                    if (!result.ok) {
                                        toast({
                                            title:
                                                result.error ??
                                                "Could not leave lobby",
                                            tone: "danger",
                                        })
                                        return
                                    }
                                    router.push("/lobbies")
                                } catch {
                                    toast({
                                        title: "Network error. Try again.",
                                        tone: "danger",
                                    })
                                } finally {
                                    setPending(null)
                                }
                            })()
                        }}
                    >
                        {pending === "leave" ? (
                            <RiLoader4Line className="animate-spin" />
                        ) : (
                            <RiLogoutBoxRLine />
                        )}
                        Leave
                    </Button>
                </>
            )}
        </div>
    )
}
