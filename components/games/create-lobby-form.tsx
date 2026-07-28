"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import * as React from "react"

import { createFreeLobby } from "@/actions/lobbies"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useUserStore } from "@/store/user"

export type CreateLobbyGameRef = {
    id: string
    name: string
}

type CreateLobbyFormProps = {
    game: CreateLobbyGameRef
    onCreated?: () => void
    className?: string
}

export function CreateLobbyForm({
    game,
    onCreated,
    className,
}: CreateLobbyFormProps) {
    const router = useRouter()
    const user = useUserStore((s) => s.user)
    const loadingUser = useUserStore((s) => s.loading)
    const [name, setName] = React.useState(`${game.name} lobby`)
    const [description, setDescription] = React.useState("")
    const [isPrivate, setIsPrivate] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [pending, setPending] = React.useState(false)

    React.useEffect(() => {
        setName(`${game.name} lobby`)
        setDescription("")
        setIsPrivate(false)
        setError(null)
    }, [game.id, game.name])

    async function onSubmit(event: React.FormEvent) {
        event.preventDefault()
        setError(null)
        if (!user) {
            setError("Sign in to create a lobby.")
            return
        }
        setPending(true)
        try {
            const detail = await createFreeLobby({
                name,
                description: description.trim() || undefined,
                gameId: game.id,
                isPrivate,
            })
            onCreated?.()
            router.push(`/lobby/${detail.lobby.path}`)
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Failed to create lobby"
            )
        } finally {
            setPending(false)
        }
    }

    return (
        <form
            onSubmit={onSubmit}
            className={cn("space-y-4", className)}
        >
            <div className="space-y-2">
                <Label htmlFor={`lobby-name-${game.id}`}>Lobby name</Label>
                <Input
                    id={`lobby-name-${game.id}`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={80}
                    required
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor={`lobby-desc-${game.id}`}>
                    Description (optional)
                </Label>
                <Input
                    id={`lobby-desc-${game.id}`}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={200}
                />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                />
                Private lobby
            </label>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {!loadingUser && !user ? (
                <p className="text-sm text-muted-foreground">
                    <Link href="/auth/login" className="underline">
                        Sign in
                    </Link>{" "}
                    to create a lobby.
                </p>
            ) : null}
            <Button
                type="submit"
                disabled={pending || loadingUser || !user}
                className={cn(buttonVariants({ variant: "primary" }))}
            >
                {pending ? "Creating…" : "Create free lobby"}
            </Button>
        </form>
    )
}
