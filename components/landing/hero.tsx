"use client"

import Link from "next/link"
import { RiArrowRightLine } from "@remixicon/react"

import { LiveNumber } from "@/components/common/live-number"
import { LobbyStatusBadge } from "@/components/common/status-badge"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { Button, LiveDot } from "@/components/ui"
import { useGameActivity } from "@/hooks/use-game-activity"
import { useLobbyFeed } from "@/hooks/use-lobby-feed"
import type { GameActivity, GameMetadata, Lobby } from "@/lib/api/types"
import { formatUsdc, timeAgo } from "@/lib/format"

export function Hero({
    activity,
    games,
    initialLobbies,
}: {
    activity: GameActivity[]
    games: GameMetadata[]
    initialLobbies: Lobby[]
}) {
    const { totals } = useGameActivity(activity)

    return (
        <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-grid">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/12 via-transparent to-gold/8" />

            <div className="relative grid gap-10 px-6 py-14 sm:px-10 sm:py-16 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center lg:gap-14 lg:py-20">
                <div className="flex flex-col gap-7">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-surface/70 px-3 py-1.5 text-xs">
                        <LiveDot />
                        <LiveNumber
                            value={totals.activePlayers}
                            className="font-medium"
                        />
                        <span className="text-muted-foreground">
                            players in matches right now
                        </span>
                    </span>

                    <div className="space-y-5">
                        <h1 className="font-display text-4xl leading-[1.05] sm:text-6xl">
                            Put something
                            <br />
                            on the line.
                        </h1>
                        <p className="max-w-lg text-base text-muted-foreground sm:text-lg">
                            {games.length} skill games, real lobbies, real
                            stakes. Entry fees sit in an on-chain vault until the
                            match ends, then the winner gets paid in the same
                            transaction.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button
                            size="lg"
                            variant="primary"
                            render={<Link href="/games" />}
                        >
                            Browse games
                            <RiArrowRightLine />
                        </Button>
                        <CreateLobbyButton
                            variant="outline"
                            size="lg"
                            withIcon={false}
                        >
                            Host a lobby
                        </CreateLobbyButton>
                    </div>

                    <dl className="flex flex-wrap gap-x-10 gap-y-4 border-t border-border/60 pt-6">
                        <Figure
                            label="Live matches"
                            value={<LiveNumber value={totals.liveLobbies} />}
                        />
                        <Figure
                            label="Open lobbies"
                            value={<LiveNumber value={totals.waitingLobbies} />}
                        />
                        <Figure
                            label="Pots in play"
                            value={
                                <LiveNumber
                                    value={totals.openPotMicro}
                                    format={(value) =>
                                        formatUsdc(value, { zero: "$0" })
                                    }
                                />
                            }
                            tone="gold"
                        />
                    </dl>
                </div>

                <OpenTables initialLobbies={initialLobbies} games={games} />
            </div>
        </section>
    )
}

/** The live half of the hero: whatever is open right now, as it changes. */
function OpenTables({
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
    const visible = lobbies.slice(0, 4)
    const nameFor = (id: string) =>
        games.find((game) => game.id === id)?.name ?? id

    return (
        <div className="flex min-h-56 flex-col rounded-2xl border border-border/70 p-4 backdrop-blur surface-raised">
            <div className="flex items-center justify-between pb-3">
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                    Open lobbies
                </p>
                <Link
                    href="/lobbies"
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    See all
                </Link>
            </div>

            {visible.length === 0 ? (
                <p className="grid flex-1 place-items-center text-center text-sm text-muted-foreground">
                    Nothing open yet. Host the first lobby.
                </p>
            ) : (
                <ul className="divide-y divide-border/50">
                    {visible.map((lobby, index) => (
                        <li
                            key={lobby.id}
                            className="stagger animate-rise-in py-2.5"
                            style={{ "--index": index } as React.CSSProperties}
                        >
                            <Link
                                href={`/room/${lobby.path}`}
                                className="flex items-center gap-3"
                            >
                                <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-medium">
                                        {lobby.name}
                                    </span>
                                    <span className="block truncate text-xs text-muted-foreground">
                                        {nameFor(lobby.gameId)} ·{" "}
                                        {lobby.participants.length} in ·{" "}
                                        {timeAgo(lobby.createdAt)}
                                    </span>
                                </span>
                                <span className="shrink-0 text-right">
                                    <span className="block text-sm text-gold">
                                        {formatUsdc(lobby.entryAmountMicro)}
                                    </span>
                                    <LobbyStatusBadge
                                        status={lobby.status}
                                        className="mt-0.5"
                                    />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

function Figure({
    label,
    value,
    tone,
}: {
    label: string
    value: React.ReactNode
    tone?: "gold"
}) {
    return (
        <div className="space-y-1">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">
                {label}
            </dt>
            <dd
                className={`font-display text-2xl ${tone === "gold" ? "text-gold" : ""}`}
            >
                {value}
            </dd>
        </div>
    )
}
