import Link from "next/link"
import { notFound } from "next/navigation"

import { getLobbyByPath } from "@/lib/api/server"

type Props = {
    params: Promise<{ path: string }>
}

export default async function LobbyRoomPage({ params }: Props) {
    const { path } = await params
    const detail = await getLobbyByPath(path)
    if (!detail) notFound()

    const { lobby, players, state } = detail

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
            <Link
                href={`/game/${lobby.gameId}`}
                className="text-sm text-muted-foreground hover:text-foreground"
            >
                ← {lobby.gameId}
            </Link>
            <h1 className="mt-4 font-display text-4xl tracking-tight">
                {lobby.name}
            </h1>
            {lobby.description ? (
                <p className="mt-2 text-muted-foreground">{lobby.description}</p>
            ) : null}
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
                <div>
                    <dt className="text-muted-foreground">Path</dt>
                    <dd className="font-mono">{lobby.path}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Status</dt>
                    <dd>{state?.status ?? lobby.status}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Game</dt>
                    <dd>{lobby.gameId}</dd>
                </div>
                <div>
                    <dt className="text-muted-foreground">Players</dt>
                    <dd>
                        {state?.participantCount ?? lobby.participants.length}
                    </dd>
                </div>
            </dl>
            <section className="mt-10">
                <h2 className="font-display text-2xl tracking-tight">
                    Participants
                </h2>
                <ul className="mt-4 space-y-2">
                    {players.map((player) => (
                        <li
                            key={player.userId}
                            className="flex items-center justify-between border-b border-border/60 py-2 text-sm"
                        >
                            <span>
                                {player.displayName ||
                                    player.username ||
                                    player.userId.slice(0, 8)}
                                {player.isCreator ? (
                                    <span className="ml-2 text-muted-foreground">
                                        (creator)
                                    </span>
                                ) : null}
                            </span>
                            <span className="text-muted-foreground">
                                {player.status}
                            </span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}
