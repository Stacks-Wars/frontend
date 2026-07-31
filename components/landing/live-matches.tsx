"use client"

import Link from "next/link"

import { SectionHeader } from "@/components/common/section"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { LobbyCard } from "@/components/lobbies/lobby-card"
import { Button, EmptyState } from "@/components/ui"
import { useLobbyFeed } from "@/hooks/use-lobby-feed"
import type { GameMetadata, Lobby } from "@/lib/api/types"

/** Open and running lobbies, kept current by the global feed. */
export function LiveMatches({
    initialLobbies,
    games,
}: {
    initialLobbies: Lobby[]
    games: GameMetadata[]
}) {
    const { lobbies } = useLobbyFeed(
        initialLobbies,
        { statuses: ["waiting", "starting", "inProgress"] },
        "filling"
    )
    const gamesById = new Map(games.map((game) => [game.id, game]))
    const visible = lobbies.slice(0, 6)

    return (
        <section className="space-y-4">
            <SectionHeader
                title="Happening now"
                description="Jump into a lobby that already has players in it."
                action={
                    <Button
                        variant="ghost"
                        size="sm"
                        render={<Link href="/lobbies" />}
                    >
                        All lobbies
                    </Button>
                }
            />

            {visible.length === 0 ? (
                <EmptyState
                    title="The floor is empty"
                    description="Open the first lobby and everyone browsing will see it appear."
                    action={<CreateLobbyButton />}
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visible.map((lobby, index) => (
                        <LobbyCard
                            key={lobby.id}
                            lobby={lobby}
                            game={gamesById.get(lobby.gameId)}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </section>
    )
}
