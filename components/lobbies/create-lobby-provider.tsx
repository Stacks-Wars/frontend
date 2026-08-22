"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { RiAddLine } from "@remixicon/react"

import { listGamesAction } from "@/actions/games"
import { CreateLobbyDialog } from "@/components/lobbies/create-lobby-dialog"
import { Button } from "@/components/ui"
import {
    useCreateLobby,
    useCreateLobbyActions,
    useCreateLobbyGameId,
    useCreateLobbyOpen,
    useCreateLobbySession,
} from "@/stores/create-lobby"

export { useCreateLobby } from "@/stores/create-lobby"

/**
 * Mounts the create-lobby dialog once. Any button that wants to host a lobby
 * calls `open()`, so there is exactly one form.
 */
export function CreateLobbyHost() {
    const open = useCreateLobbyOpen()
    const gameId = useCreateLobbyGameId()
    const session = useCreateLobbySession()
    const { setOpen } = useCreateLobbyActions()

    const { data: games } = useQuery({
        queryKey: ["games"],
        queryFn: () => listGamesAction(),
        staleTime: 10 * 60_000,
    })

    return (
        <CreateLobbyDialog
            key={session}
            open={open}
            onOpenChange={setOpen}
            games={games ?? []}
            gameId={gameId}
        />
    )
}

export function CreateLobbyButton({
    gameId,
    children = "Create lobby",
    variant = "primary",
    size = "default",
    className,
    withIcon = true,
}: {
    gameId?: string
    children?: React.ReactNode
    variant?: React.ComponentProps<typeof Button>["variant"]
    size?: React.ComponentProps<typeof Button>["size"]
    className?: string
    withIcon?: boolean
}) {
    const { open } = useCreateLobby()
    return (
        <Button
            variant={variant}
            size={size}
            className={className}
            onClick={() => open(gameId)}
        >
            {withIcon ? <RiAddLine /> : null}
            {children}
        </Button>
    )
}
