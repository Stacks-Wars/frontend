"use client"

import * as React from "react"
import { RiSearchLine } from "@remixicon/react"

import { GameCard } from "@/components/games/game-card"
import { EmptyState, Input } from "@/components/ui"
import { useGameActivity } from "@/hooks/use-game-activity"
import type { GameActivity, GameMetadata } from "@/lib/api/types"
import { label } from "@/lib/format"
import { cn } from "@/lib/utils"

type Sort = "live" | "name" | "players"

const SORTS: { id: Sort; label: string }[] = [
    { id: "live", label: "Most active" },
    { id: "players", label: "Biggest pots" },
    { id: "name", label: "A–Z" },
]

export function GamesDirectory({
    games,
    initialActivity,
}: {
    games: GameMetadata[]
    initialActivity: GameActivity[]
}) {
    const { get } = useGameActivity(initialActivity)
    const [search, setSearch] = React.useState("")
    const [category, setCategory] = React.useState<string | null>(null)
    const [sort, setSort] = React.useState<Sort>("live")

    const categories = React.useMemo(() => {
        const set = new Set<string>()
        for (const game of games) {
            for (const item of game.categories) set.add(item)
        }
        return Array.from(set).sort()
    }, [games])

    const visible = React.useMemo(() => {
        const term = search.trim().toLowerCase()
        return games
            .filter((game) => {
                if (category && !game.categories.includes(category)) return false
                if (!term) return true
                return `${game.name} ${game.description}`
                    .toLowerCase()
                    .includes(term)
            })
            .sort((a, b) => {
                if (sort === "name") return a.name.localeCompare(b.name)
                const left = get(a.id)
                const right = get(b.id)
                if (sort === "players") {
                    return right.openPotMicro - left.openPotMicro
                }
                return (
                    right.activePlayers + right.liveLobbies * 2 -
                    (left.activePlayers + left.liveLobbies * 2)
                )
            })
    }, [games, search, category, sort, get])

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="relative max-w-sm flex-1">
                    <RiSearchLine className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search games"
                        className="pl-9"
                        aria-label="Search games"
                    />
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-border/70 p-1">
                    {SORTS.map((option) => (
                        <button
                            key={option.id}
                            type="button"
                            onClick={() => setSort(option.id)}
                            className={cn(
                                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                                sort === option.id
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            </div>

            {categories.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                    <FilterChip
                        active={category === null}
                        onClick={() => setCategory(null)}
                    >
                        All
                    </FilterChip>
                    {categories.map((item) => (
                        <FilterChip
                            key={item}
                            active={category === item}
                            onClick={() =>
                                setCategory(category === item ? null : item)
                            }
                        >
                            {label(item)}
                        </FilterChip>
                    ))}
                </div>
            ) : null}

            {visible.length === 0 ? (
                <EmptyState
                    title="No games match that"
                    description="Try a different search or clear the category filter."
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visible.map((game, index) => (
                        <GameCard
                            key={game.id}
                            game={game}
                            activity={get(game.id)}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean
    onClick: () => void
    children: React.ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
            )}
        >
            {children}
        </button>
    )
}
