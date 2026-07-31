"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { RiEqualizerLine, RiSearchLine } from "@remixicon/react"

import { LiveNumber } from "@/components/common/live-number"
import { CreateLobbyButton } from "@/components/lobbies/create-lobby-provider"
import { LobbyCard } from "@/components/lobbies/lobby-card"
import {
    Badge,
    Button,
    EmptyState,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Sheet,
    SheetBody,
    SheetContent,
    SheetHeader,
    SheetTitle,
    Switch,
} from "@/components/ui"
import { useLobbyFeed, type LobbyFilters, type LobbySort } from "@/hooks/use-lobby-feed"
import { useUserCards } from "@/hooks/use-user-cards"
import type { GameMetadata, Lobby, LobbyStatus } from "@/lib/api/types"
import { displayNameFor } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useSessionStore } from "@/stores/session"

type StatusTab = "open" | "live" | "all"

const STATUS_TABS: { id: StatusTab; label: string; statuses?: LobbyStatus[] }[] = [
    { id: "open", label: "Open", statuses: ["waiting"] },
    { id: "live", label: "Live", statuses: ["starting", "inProgress"] },
    { id: "all", label: "All" },
]

const SORTS: { id: LobbySort; label: string }[] = [
    { id: "newest", label: "Newest" },
    { id: "filling", label: "Filling up" },
    { id: "pot", label: "Biggest pot" },
    { id: "players", label: "Most players" },
]

// Select triggers render the raw value unless the labels are declared here.
const SORT_LABELS: Record<string, string> = Object.fromEntries(
    SORTS.map((option) => [option.id, option.label])
)

export function LobbyBrowser({
    initialLobbies,
    games,
}: {
    initialLobbies: Lobby[]
    games: GameMetadata[]
}) {
    const searchParams = useSearchParams()
    const me = useSessionStore((s) => s.user)

    const [tab, setTab] = React.useState<StatusTab>("open")
    const [gameId, setGameId] = React.useState<string>(
        searchParams.get("game") ?? "all"
    )
    const [entry, setEntry] = React.useState<"all" | "free" | "paid">("all")
    const [search, setSearch] = React.useState("")
    const [minPlayers, setMinPlayers] = React.useState("")
    const [hostedByMe, setHostedByMe] = React.useState(false)
    const [creatorId, setCreatorId] = React.useState<string>("all")
    const [sort, setSort] = React.useState<LobbySort>("filling")
    const [filtersOpen, setFiltersOpen] = React.useState(false)

    const filters = React.useMemo<LobbyFilters>(
        () => ({
            gameId: gameId === "all" ? null : gameId,
            statuses: STATUS_TABS.find((item) => item.id === tab)?.statuses,
            entry,
            creatorId: hostedByMe
                ? (me?.id ?? null)
                : creatorId === "all"
                  ? null
                  : creatorId,
            minPlayers: minPlayers ? Number.parseInt(minPlayers, 10) : null,
            search,
        }),
        [gameId, tab, entry, hostedByMe, me?.id, creatorId, minPlayers, search]
    )

    const { lobbies, total } = useLobbyFeed(initialLobbies, filters, sort, {
        authoritative: true,
    })

    const hostIds = React.useMemo(
        () => Array.from(new Set(initialLobbies.map((lobby) => lobby.creatorId))),
        [initialLobbies]
    )
    const { get: getHost } = useUserCards(hostIds)

    const gamesById = React.useMemo(
        () => new Map(games.map((game) => [game.id, game])),
        [games]
    )

    const gameLabels = React.useMemo<Record<string, string>>(
        () => ({
            all: "All games",
            ...Object.fromEntries(games.map((game) => [game.id, game.name])),
        }),
        [games]
    )

    const hostLabels = React.useMemo<Record<string, string>>(
        () => ({
            all: "Anyone",
            ...Object.fromEntries(
                hostIds.map((id) => [id, displayNameFor(getHost(id))])
            ),
        }),
        [hostIds, getHost]
    )

    const activeFilterCount = [
        gameId !== "all",
        entry !== "all",
        Boolean(minPlayers),
        hostedByMe || creatorId !== "all",
    ].filter(Boolean).length

    function reset() {
        setGameId("all")
        setEntry("all")
        setMinPlayers("")
        setHostedByMe(false)
        setCreatorId("all")
        setSearch("")
    }

    const filterControls = (
        <div className="space-y-5">
            <div className="grid gap-2">
                <Label htmlFor="filter-game">Game</Label>
                <Select
                    value={gameId}
                    onValueChange={(value) => setGameId(value as string)}
                    items={gameLabels}
                >
                    <SelectTrigger id="filter-game">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All games</SelectItem>
                        {games.map((game) => (
                            <SelectItem key={game.id} value={game.id}>
                                {game.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label>Entry</Label>
                <div className="flex gap-1.5">
                    {(["all", "free", "paid"] as const).map((option) => (
                        <button
                            key={option}
                            type="button"
                            onClick={() => setEntry(option)}
                            className={cn(
                                "flex-1 rounded-lg border px-3 py-2 text-sm capitalize transition-colors",
                                entry === option
                                    ? "border-primary bg-primary/15 text-primary"
                                    : "border-border text-muted-foreground hover:border-border-strong"
                            )}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid gap-2">
                <Label htmlFor="filter-min">Minimum players</Label>
                <Input
                    id="filter-min"
                    type="number"
                    min="0"
                    max="8"
                    value={minPlayers}
                    onChange={(event) => setMinPlayers(event.target.value)}
                    placeholder="Any"
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="filter-host">Host</Label>
                <Select
                    value={creatorId}
                    onValueChange={(value) => {
                        setCreatorId(value as string)
                        setHostedByMe(false)
                    }}
                    items={hostLabels}
                >
                    <SelectTrigger id="filter-host">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Anyone</SelectItem>
                        {hostIds.map((id) => (
                            <SelectItem key={id} value={id}>
                                {displayNameFor(getHost(id))}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {me ? (
                <label className="flex items-center justify-between gap-3 rounded-lg border border-border/70 px-3 py-2.5">
                    <span className="text-sm">Only lobbies I host</span>
                    <Switch
                        checked={hostedByMe}
                        onCheckedChange={(checked) => {
                            setHostedByMe(checked)
                            if (checked) setCreatorId("all")
                        }}
                    />
                </label>
            ) : null}

            <Button variant="ghost" className="w-full" onClick={reset}>
                Clear filters
            </Button>
        </div>
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="flex items-center gap-1 rounded-lg border border-border/70 p-1">
                    {STATUS_TABS.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setTab(item.id)}
                            className={cn(
                                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                                tab === item.id
                                    ? "bg-muted text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <div className="relative flex-1 lg:max-w-sm">
                    <RiSearchLine className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(event) => setSearch(event.target.value)}
                        placeholder="Search lobbies"
                        className="pl-9"
                        aria-label="Search lobbies"
                    />
                </div>

                <div className="flex items-center gap-2 lg:ml-auto">
                    <Select
                        value={sort}
                        onValueChange={(value) => setSort(value as LobbySort)}
                        items={SORT_LABELS}
                    >
                        <SelectTrigger className="w-40">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {SORTS.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Button
                        variant="outline"
                        className="lg:hidden"
                        onClick={() => setFiltersOpen(true)}
                    >
                        <RiEqualizerLine />
                        Filters
                        {activeFilterCount > 0 ? (
                            <Badge variant="primary">{activeFilterCount}</Badge>
                        ) : null}
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                    <div className="sticky top-24 space-y-5 rounded-2xl border border-border/70 p-5 surface-raised">
                        {filterControls}
                    </div>
                </aside>

                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        <LiveNumber
                            value={lobbies.length}
                            className="font-medium text-foreground"
                        />{" "}
                        of {total} lobbies
                    </p>

                    {lobbies.length === 0 ? (
                        <EmptyState
                            title="Nothing here yet"
                            description="No lobby matches these filters. Host one and players will see it appear instantly."
                            action={<CreateLobbyButton />}
                        />
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                            {lobbies.map((lobby, index) => (
                                <LobbyCard
                                    key={lobby.id}
                                    lobby={lobby}
                                    game={gamesById.get(lobby.gameId)}
                                    index={index}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetContent side="bottom">
                    <SheetHeader>
                        <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <SheetBody>{filterControls}</SheetBody>
                </SheetContent>
            </Sheet>
        </div>
    )
}
