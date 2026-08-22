"use client"

import Link from "next/link"
import { RiGroupLine, RiPlayCircleLine, RiTrophyLine } from "@remixicon/react"

import { GameArt } from "@/components/common/game-art"
import { LiveNumber } from "@/components/common/live-number"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { Badge, ButtonLink, LiveDot } from "@/components/ui"
import { isPlayable } from "@/games/playable"
import type { GameActivity, GameMetadata } from "@/lib/api/types"
import { compact, formatUsdc, label } from "@/lib/format"

export function GameCard({
    game,
    activity,
    index = 0,
}: {
    game: GameMetadata
    activity: GameActivity
    index?: number
}) {
    const live = activity.liveLobbies > 0
    const open = activity.waitingLobbies

    return (
        <article
            className="stagger group flex animate-rise-in flex-col overflow-hidden rounded-2xl border border-border/70 transition-colors surface-raised hover:border-border-strong"
            style={{ "--index": index } as React.CSSProperties}
        >
            <Link href={`/games/${game.id}`} className="relative block">
                <GameArt gameId={game.id} name={game.name} aspect="cover" />
                <div className="absolute top-3 left-3 flex gap-1.5">
                    {live ? (
                        <Badge variant="live">
                            {compact(activity.liveLobbies)} live
                        </Badge>
                    ) : null}
                    {!isPlayable(game.id) ? (
                        <Badge variant="outline">Preview</Badge>
                    ) : null}
                </div>
                <div className="absolute right-3 bottom-3 left-3 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="truncate font-display text-lg">
                            {game.name}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                            {game.minPlayers === game.maxPlayers
                                ? `${game.minPlayers} players`
                                : `${game.minPlayers}–${game.maxPlayers} players`}
                        </p>
                    </div>
                    {activity.openPotMicro > 0 ? (
                        <span className="shrink-0 rounded-lg bg-gold/15 px-2 py-1 text-xs font-medium text-gold">
                            {formatUsdc(activity.openPotMicro)} up
                        </span>
                    ) : null}
                </div>
            </Link>

            <div className="flex flex-1 flex-col gap-4 p-4">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {game.description}
                </p>

                <div className="flex flex-wrap gap-1.5">
                    {game.categories.slice(0, 3).map((category) => (
                        <Badge key={category} variant="outline">
                            {label(category)}
                        </Badge>
                    ))}
                </div>

                <dl className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-center">
                    <Metric
                        icon={<RiGroupLine />}
                        label="Playing"
                        value={activity.activePlayers}
                        accent={activity.activePlayers > 0}
                    />
                    <Metric
                        icon={<RiPlayCircleLine />}
                        label="Open"
                        value={open}
                    />
                    <Metric
                        icon={<RiTrophyLine />}
                        label="Live"
                        value={activity.liveLobbies}
                    />
                </dl>

                <div className="mt-auto flex gap-2">
                    <ButtonLink
                        href={`/games/${game.id}`}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                    >
                        Open
                    </ButtonLink>
                    <CreateLobbyButton
                        gameId={game.id}
                        size="sm"
                        className="flex-1"
                        withIcon={false}
                    >
                        Create lobby
                    </CreateLobbyButton>
                </div>
            </div>
        </article>
    )
}

function Metric({
    icon,
    label,
    value,
    accent,
}: {
    icon: React.ReactNode
    label: string
    value: number
    accent?: boolean
}) {
    return (
        <div className="space-y-0.5">
            <dt className="flex items-center justify-center gap-1 text-[11px] text-muted-foreground [&_svg]:size-3">
                {accent ? <LiveDot /> : icon}
                {label}
            </dt>
            <dd className="font-display text-base">
                <LiveNumber value={value} />
            </dd>
        </div>
    )
}
