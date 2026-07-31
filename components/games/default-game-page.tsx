"use client"

import Link from "next/link"
import * as React from "react"
import {
    RiArrowLeftLine,
    RiFlashlightLine,
    RiGroupLine,
    RiShieldCheckLine,
    RiTrophyLine,
} from "@remixicon/react"

import { GameArt } from "@/components/common/game-art"
import { LiveNumber } from "@/components/common/live-number"
import { SectionHeader } from "@/components/common/section"
import { UserChip } from "@/components/common/user-chip"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { LobbyCard } from "@/components/lobbies/lobby-card"
import { Badge, Button, EmptyState, Stat } from "@/components/ui"
import { isPlayable } from "@/games/playable"
import type { DefaultGameSections, GamePageProps } from "@/games/types"
import { useLobbyFeed, type LobbyFilters } from "@/hooks/use-lobby-feed"
import { formatPercent, formatUsdc, label, timeAgo } from "@/lib/format"
import { cn } from "@/lib/utils"

const LOBBY_TABS: { id: "open" | "live" | "all"; label: string }[] = [
    { id: "open", label: "Open" },
    { id: "live", label: "Live" },
    { id: "all", label: "All" },
]

/**
 * The stock `/games/:gameId` experience.
 *
 * Every section is handed to registered game modules as `sections`, so a game
 * can reuse the parts it likes and replace only what it needs.
 */
export function useDefaultGameSections({
    game,
    activity,
    lobbies,
    recentMatches,
}: Omit<GamePageProps, "sections">): DefaultGameSections {
    const [tab, setTab] = React.useState<"open" | "live" | "all">("open")

    const filters = React.useMemo<LobbyFilters>(() => {
        const base: LobbyFilters = { gameId: game.id }
        if (tab === "open") return { ...base, statuses: ["waiting"] }
        if (tab === "live") return { ...base, statuses: ["starting", "inProgress"] }
        return base
    }, [game.id, tab])

    const { lobbies: visible } = useLobbyFeed(lobbies, filters, "filling")

    const Hero = React.useCallback(
        () => (
            <section className="overflow-hidden rounded-3xl border border-border/70 surface-raised">
                <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                        <div className="space-y-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="-ml-3 w-fit text-muted-foreground"
                                render={<Link href="/games" />}
                            >
                                <RiArrowLeftLine />
                                Back to games
                            </Button>

                            <div className="space-y-3">
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="font-display text-3xl sm:text-4xl">
                                        {game.name}
                                    </h1>
                                    {activity.liveLobbies > 0 ? (
                                        <Badge variant="live">
                                            {activity.liveLobbies} live
                                        </Badge>
                                    ) : null}
                                    {!isPlayable(game.id) ? (
                                        <Badge variant="outline">Preview</Badge>
                                    ) : null}
                                </div>
                                <p className="max-w-xl text-sm text-muted-foreground">
                                    {game.description}
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {game.categories.map((category) => (
                                        <Badge key={category} variant="outline">
                                            {label(category)}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <CreateLobbyButton gameId={game.id} size="lg">
                                Create lobby
                            </CreateLobbyButton>
                            <Button
                                variant="outline"
                                size="lg"
                                render={
                                    <Link href={`/lobbies?game=${game.id}`} />
                                }
                            >
                                Browse lobbies
                            </Button>
                        </div>
                    </div>

                    <GameArt
                        gameId={game.id}
                        name={game.name}
                        aspect="square"
                        className="hidden rounded-none md:block"
                    />
                </div>
            </section>
        ),
        [game, activity.liveLobbies]
    )

    const Stats = React.useCallback(
        () => (
            <section className="grid gap-4 rounded-2xl border border-border/70 p-5 surface-raised sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                    icon={<RiGroupLine />}
                    label="Playing now"
                    value={<LiveNumber value={activity.activePlayers} />}
                    tone={activity.activePlayers > 0 ? "live" : "default"}
                />
                <Stat
                    icon={<RiFlashlightLine />}
                    label="Open lobbies"
                    value={<LiveNumber value={activity.waitingLobbies} />}
                    hint={`${activity.liveLobbies} in progress`}
                />
                <Stat
                    icon={<RiTrophyLine />}
                    label="Pots up for grabs"
                    value={
                        <LiveNumber
                            value={activity.openPotMicro}
                            format={(value) => formatUsdc(value, { zero: "$0" })}
                        />
                    }
                    tone="gold"
                />
                <Stat
                    icon={<RiShieldCheckLine />}
                    label="Lobby size"
                    value={
                        game.minPlayers === game.maxPlayers
                            ? game.minPlayers
                            : `${game.minPlayers}–${game.maxPlayers}`
                    }
                    hint={`Dev fee ${formatPercent(game.fee.percentage * 100)}`}
                />
            </section>
        ),
        [activity, game]
    )

    const Lobbies = React.useCallback(
        () => (
            <section className="space-y-4">
                <SectionHeader
                    title="Lobbies"
                    description="Updates the moment someone opens or joins a lobby."
                    action={
                        <div className="flex items-center gap-1 rounded-lg border border-border/70 p-1">
                            {LOBBY_TABS.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => setTab(item.id)}
                                    className={cn(
                                        "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                        tab === item.id
                                            ? "bg-muted text-foreground"
                                            : "text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    }
                />

                {visible.length === 0 ? (
                    <EmptyState
                        title={
                            tab === "live"
                                ? "Nothing running right now"
                                : "No open lobbies"
                        }
                        description="Host one and it shows up for everyone else instantly."
                        action={
                            <CreateLobbyButton gameId={game.id}>
                                Create the first lobby
                            </CreateLobbyButton>
                        }
                    />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {visible.map((lobby, index) => (
                            <LobbyCard
                                key={lobby.id}
                                lobby={lobby}
                                game={game}
                                index={index}
                                showGame={false}
                            />
                        ))}
                    </div>
                )}
            </section>
        ),
        [visible, tab, game]
    )

    const Activity = React.useCallback(
        () => (
            <section className="space-y-4">
                <SectionHeader
                    title="Recent results"
                    description="How the last matches finished."
                />
                {recentMatches.length === 0 ? (
                    <EmptyState
                        title="No matches yet"
                        description="Be the first name on this board."
                    />
                ) : (
                    <ul className="divide-y divide-border/50 overflow-hidden rounded-2xl border border-border/70 surface-raised">
                        {recentMatches.map((match) => (
                            <li
                                key={match.matchId}
                                className="flex items-center gap-3 px-4 py-3"
                            >
                                <UserChip
                                    user={{
                                        userId: match.winnerId ?? "",
                                        username: match.winnerUsername,
                                        displayName: match.winnerDisplayName,
                                        avatarUrl: match.winnerAvatarUrl,
                                    }}
                                    subtitle={`${match.playerCount} players · ${timeAgo(match.finishedAt)}`}
                                />
                                <span className="ml-auto shrink-0 text-right">
                                    <span className="block font-display text-sm text-gold">
                                        {formatUsdc(match.winnerPrizeMicro, {
                                            zero: "—",
                                        })}
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        pot {formatUsdc(match.potMicro, { zero: "free" })}
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        ),
        [recentMatches]
    )

    const HowItWorks = React.useCallback(
        () => (
            <section className="grid gap-4 sm:grid-cols-3">
                {[
                    {
                        title: "Join a lobby",
                        body: `Entry is escrowed on-chain the moment you join. Leave before the match starts and it comes straight back.`,
                    },
                    {
                        title: "Play it out",
                        body: `The server runs the match. Every move is validated before it reaches the board, so nobody can fake a turn.`,
                    },
                    {
                        title: "Get paid",
                        body: `The vault splits the pot when the match settles — winner, platform, and the game developer in one transaction.`,
                    },
                ].map((item) => (
                    <div
                        key={item.title}
                        className="rounded-2xl border border-border/70 p-5 surface-raised"
                    >
                        <p className="font-display text-sm">{item.title}</p>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {item.body}
                        </p>
                    </div>
                ))}
            </section>
        ),
        []
    )

    const Default = React.useCallback(
        () => (
            <div className="space-y-8">
                <Hero />
                <Stats />
                <Lobbies />
                <Activity />
                <HowItWorks />
            </div>
        ),
        [Hero, Stats, Lobbies, HowItWorks, Activity]
    )

    return { Hero, Stats, Lobbies, Activity, HowItWorks, Default }
}
