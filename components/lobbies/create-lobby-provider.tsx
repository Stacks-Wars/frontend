"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { RiAddLine } from "@remixicon/react"

import { listGamesAction } from "@/actions/games"
import { CreateLobbyDialog } from "@/components/lobbies/create-lobby-dialog"
import { Button } from "@/components/ui"

type CreateLobbyContext = {
    open: (gameId?: string) => void
}

const Context = React.createContext<CreateLobbyContext | null>(null)

/**
 * Mounts the create-lobby dialog once for the whole app. Any button that wants
 * to host a lobby calls `open()`, so there is exactly one form.
 */
export function CreateLobbyProvider({
    children,
}: {
    children: React.ReactNode
}) {
    const [open, setOpen] = React.useState(false)
    const [gameId, setGameId] = React.useState<string | undefined>()
    // Remounting on each open is what clears the form.
    const [session, setSession] = React.useState(0)

    const { data: games } = useQuery({
        queryKey: ["games"],
        queryFn: () => listGamesAction(),
        staleTime: 10 * 60_000,
    })

    const value = React.useMemo<CreateLobbyContext>(
        () => ({
            open: (nextGameId) => {
                setGameId(nextGameId)
                setSession((count) => count + 1)
                setOpen(true)
            },
        }),
        []
    )

    return (
        <Context.Provider value={value}>
            {children}
            <CreateLobbyDialog
                key={session}
                open={open}
                onOpenChange={setOpen}
                games={games ?? []}
                gameId={gameId}
            />
        </Context.Provider>
    )
}

export function useCreateLobby(): CreateLobbyContext {
    const context = React.useContext(Context)
    if (!context) {
        throw new Error("useCreateLobby must be used inside CreateLobbyProvider")
    }
    return context
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
