"use client"

import * as React from "react"

import { TrendChart } from "@/components/analytics/trend-chart"
import { PageHeader, SectionHeader } from "@/components/common/section"
import {
    Badge,
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    EmptyState,
    Input,
    Label,
    Progress,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Skeleton,
    Stat,
} from "@/components/ui"
import { usePlatformAnalytics } from "@/hooks/use-platform-analytics"
import type {
    AnalyticsGrain,
    AnalyticsQuery,
    AnalyticsReport,
    GameMetadata,
    Season,
} from "@/lib/api/types"
import { chainAdapter, type ChainId } from "@/lib/chain"
import { formatDate, formatUsdc } from "@/lib/format"
import { cn } from "@/lib/utils"

type RangeMode = "overall" | "season" | "custom"

const CHAINS: { id: "all" | ChainId; label: string }[] = [
    { id: "all", label: "All chains" },
    { id: "solana", label: chainAdapter("solana").label },
    { id: "stacks", label: chainAdapter("stacks").label },
]

function formatCount(value: number): string {
    return value.toLocaleString("en-US")
}

function formatRate(value: number | null): string {
    if (value == null) return "—"
    return `${(value * 100).toFixed(1)}%`
}

function formatMoney(micro: number): string {
    return formatUsdc(micro, { zero: "$0" })
}

function formatBucket(value: string | number, grain: AnalyticsGrain): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "—"
    if (grain === "month") {
        return date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        })
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

function isoDate(d: Date): string {
    return d.toISOString().slice(0, 10)
}

function defaultCustomRange(): { from: string; to: string } {
    const to = new Date()
    const from = new Date()
    from.setUTCDate(from.getUTCDate() - 29)
    return { from: isoDate(from), to: isoDate(to) }
}

export function AnalyticsView({
    seasons,
    games,
}: {
    seasons: Season[]
    games: GameMetadata[]
}) {
    const ordered = React.useMemo(
        () =>
            [...seasons].sort(
                (a, b) => Date.parse(b.startsAt) - Date.parse(a.startsAt)
            ),
        [seasons]
    )
    const current = React.useMemo(() => {
        const now = Date.now()
        return (
            ordered.find(
                (season) =>
                    Date.parse(season.startsAt) <= now &&
                    Date.parse(season.endsAt) >= now
            ) ??
            ordered[0] ??
            null
        )
    }, [ordered])

    const [mode, setMode] = React.useState<RangeMode>("overall")
    const [seasonId, setSeasonId] = React.useState<number | null>(
        current?.id ?? null
    )
    const [custom, setCustom] = React.useState(defaultCustomRange)
    const [chain, setChain] = React.useState<"all" | ChainId>("all")
    const [gameId, setGameId] = React.useState("all")

    const query = React.useMemo<AnalyticsQuery>(() => {
        const next: AnalyticsQuery = {}
        if (mode === "season" && seasonId != null) next.seasonId = seasonId
        if (mode === "custom") {
            next.from = custom.from
            next.to = custom.to
        }
        if (chain !== "all") next.chain = chain
        if (gameId !== "all") next.gameId = gameId
        return next
    }, [mode, seasonId, custom, chain, gameId])

    const analytics = usePlatformAnalytics(query)

    const seasonLabels = React.useMemo(
        () =>
            Object.fromEntries(
                ordered.map((item) => [String(item.id), item.name])
            ),
        [ordered]
    )
    const gameLabels = React.useMemo(
        () => ({
            all: "Every game",
            ...Object.fromEntries(games.map((game) => [game.id, game.name])),
        }),
        [games]
    )
    const chainLabels = React.useMemo(
        () => Object.fromEntries(CHAINS.map((item) => [item.id, item.label])),
        []
    )

    const report = analytics.data
    const grain = report?.range.grain ?? "day"

    return (
        <div className="space-y-10">
            <Header
                action={
                    report ? (
                        <Badge variant="outline">
                            {formatDate(report.range.from)} —{" "}
                            {formatDate(
                                new Date(
                                    Date.parse(report.range.to) - 1
                                ).toISOString()
                            )}
                        </Badge>
                    ) : null
                }
            />

            <div className="flex flex-wrap items-end gap-3">
                <div className="flex rounded-lg border border-border/70 p-0.5 surface-raised">
                    {(
                        [
                            { id: "overall", label: "Overall" },
                            { id: "season", label: "Season" },
                            { id: "custom", label: "Custom" },
                        ] as const
                    ).map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                setMode(item.id)
                                if (item.id === "season" && seasonId == null) {
                                    setSeasonId(
                                        current?.id ?? ordered[0]?.id ?? null
                                    )
                                }
                            }}
                            className={cn(
                                "rounded-md px-3.5 py-1.5 text-sm transition-colors",
                                mode === item.id
                                    ? "bg-primary text-primary-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                {mode === "season" && ordered.length > 0 ? (
                    <Select
                        value={String(seasonId ?? "")}
                        onValueChange={(value) =>
                            setSeasonId(
                                value ? Number.parseInt(value, 10) : null
                            )
                        }
                        items={seasonLabels}
                    >
                        <SelectTrigger className="w-48" aria-label="Season">
                            <SelectValue placeholder="Season" />
                        </SelectTrigger>
                        <SelectContent>
                            {ordered.map((item) => (
                                <SelectItem
                                    key={item.id}
                                    value={String(item.id)}
                                >
                                    {item.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                ) : null}

                {mode === "custom" ? (
                    <div className="flex flex-wrap items-end gap-2">
                        <div className="space-y-1">
                            <Label
                                htmlFor="analytics-from"
                                className="text-xs text-muted-foreground"
                            >
                                From
                            </Label>
                            <Input
                                id="analytics-from"
                                type="date"
                                value={custom.from}
                                onChange={(event) =>
                                    setCustom((prev) => ({
                                        ...prev,
                                        from: event.target.value,
                                    }))
                                }
                                className="h-10 w-40"
                            />
                        </div>
                        <div className="space-y-1">
                            <Label
                                htmlFor="analytics-to"
                                className="text-xs text-muted-foreground"
                            >
                                To
                            </Label>
                            <Input
                                id="analytics-to"
                                type="date"
                                value={custom.to}
                                onChange={(event) =>
                                    setCustom((prev) => ({
                                        ...prev,
                                        to: event.target.value,
                                    }))
                                }
                                className="h-10 w-40"
                            />
                        </div>
                    </div>
                ) : null}

                <Select
                    value={chain}
                    onValueChange={(value) =>
                        setChain((value as "all" | ChainId) ?? "all")
                    }
                    items={chainLabels}
                >
                    <SelectTrigger className="w-40" aria-label="Chain">
                        <SelectValue placeholder="Chain" />
                    </SelectTrigger>
                    <SelectContent>
                        {CHAINS.map((item) => (
                            <SelectItem key={item.id} value={item.id}>
                                {item.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={gameId}
                    onValueChange={(value) => setGameId(value ?? "all")}
                    items={gameLabels}
                >
                    <SelectTrigger className="w-44" aria-label="Game">
                        <SelectValue placeholder="Game" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Every game</SelectItem>
                        {games.map((game) => (
                            <SelectItem key={game.id} value={game.id}>
                                {game.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {analytics.isLoading || !report ? (
                analytics.isError ? (
                    <EmptyState
                        title="Could not load analytics"
                        description={
                            analytics.error instanceof Error
                                ? analytics.error.message
                                : "The dashboard query failed."
                        }
                    />
                ) : (
                    <DashboardSkeleton />
                )
            ) : (
                <Dashboard report={report} grain={grain} games={games} />
            )}
        </div>
    )
}

function Header({ action }: { action?: React.ReactNode }) {
    return (
        <PageHeader
            title="Platform analytics"
            description="Growth, engagement, and protocol fees."
            action={action}
        />
    )
}

function Dashboard({
    report,
    grain,
    games,
}: {
    report: AnalyticsReport
    grain: AnalyticsGrain
    games: GameMetadata[]
}) {
    const scoped = report.range.activityScoped
    const gameName = React.useMemo(() => {
        const map = Object.fromEntries(
            games.map((game) => [game.id, game.name])
        )
        return (id: string) => map[id] ?? id
    }, [games])

    const kpis = [
        !scoped && {
            label: "Total users",
            value: formatCount(report.kpis.totalUsers),
            hint: "Accounts created by the end of this window",
        },
        !scoped && {
            label: "New users",
            value: formatCount(report.kpis.newUsers),
            hint: "Signed up in this window",
        },
        !scoped && {
            label: "Getting Started completed",
            value: formatCount(report.kpis.gettingStartedCompleted),
            hint: "Completions timestamped in this window",
        },
        !scoped && {
            label: "Getting Started rate",
            value: formatRate(report.kpis.gettingStartedCompletionRate),
            hint: `${formatCount(report.funnel.completed)} of ${formatCount(report.funnel.signups)} users who joined`,
        },
        {
            label: "Active users",
            value: formatCount(report.kpis.activeUsers),
            hint: "Played a qualifying match that finished here",
        },
        {
            label: "Returning users",
            value: formatCount(report.kpis.returningUsers),
            hint:
                report.range.scope === "overall"
                    ? "Two or more distinct days of play"
                    : "Played here after a first match before this window",
        },
        {
            label: "Games played",
            value: formatCount(report.kpis.gamesPlayed),
            hint: "Finished matches with at least two players",
        },
        {
            label: "Lobbies created",
            value: formatCount(report.kpis.totalLobbies),
            hint: "Rooms opened in this window",
        },
        {
            label: "Paid lobbies",
            value: formatCount(report.kpis.paidLobbiesCreated),
            hint: `${formatCount(report.kpis.paidLobbiesCompleted)} finished paid matches`,
        },
        {
            label: "Volume",
            value: formatMoney(report.kpis.totalVolumeMicro),
            hint: "Pots on finished paid matches",
            tone: "default" as const,
        },
        {
            label: "Platform fees earned",
            value: formatMoney(report.kpis.platformFeesMicro),
            hint: "2% protocol take on winner-paid pots",
            tone: "gold" as const,
        },
    ].filter(Boolean) as Array<{
        label: string
        value: string
        hint: string
        tone?: "default" | "gold"
    }>

    const series = report.series.map((point) => ({
        ...point,
        bucket: point.bucket,
    }))

    return (
        <div className="space-y-12">
            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {kpis.map((item) => (
                    <Card key={item.label}>
                        <CardContent className="p-5">
                            <Stat
                                label={item.label}
                                value={item.value}
                                hint={item.hint}
                                tone={item.tone}
                            />
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="space-y-4">
                <SectionHeader
                    title="Activity over time"
                    description={
                        grain === "day"
                            ? "Grouped by day."
                            : grain === "week"
                              ? "Grouped by week."
                              : "Grouped by month."
                    }
                />
                <div className="grid gap-4 lg:grid-cols-2">
                    {scoped ? null : (
                        <ChartCard
                            title="New users"
                            description="Account creation."
                        >
                            <TrendChart
                                data={series}
                                xKey="bucket"
                                formatX={(value) => formatBucket(value, grain)}
                                series={[
                                    {
                                        key: "newUsers",
                                        label: "New users",
                                        color: "var(--color-primary)",
                                    },
                                ]}
                            />
                        </ChartCard>
                    )}
                    <ChartCard
                        title="Active and returning"
                        description="Players in finished qualifying matches."
                    >
                        <TrendChart
                            data={series}
                            xKey="bucket"
                            formatX={(value) => formatBucket(value, grain)}
                            series={[
                                {
                                    key: "activeUsers",
                                    label: "Active",
                                    color: "var(--color-primary)",
                                },
                                {
                                    key: "returningUsers",
                                    label: "Returning",
                                    color: "var(--color-gold)",
                                },
                            ]}
                        />
                    </ChartCard>
                    <ChartCard
                        title="Games played"
                        description="Finished matches with two or more players."
                    >
                        <TrendChart
                            data={series}
                            xKey="bucket"
                            formatX={(value) => formatBucket(value, grain)}
                            series={[
                                {
                                    key: "gamesPlayed",
                                    label: "Games",
                                    color: "var(--color-success)",
                                },
                            ]}
                        />
                    </ChartCard>
                    <ChartCard
                        title="Paid lobby activity"
                        description="Created rooms vs finished paid matches."
                    >
                        <TrendChart
                            data={series}
                            xKey="bucket"
                            formatX={(value) => formatBucket(value, grain)}
                            series={[
                                {
                                    key: "paidLobbiesCreated",
                                    label: "Created",
                                    color: "var(--color-primary)",
                                },
                                {
                                    key: "paidLobbiesCompleted",
                                    label: "Completed",
                                    color: "var(--color-gold)",
                                },
                            ]}
                        />
                    </ChartCard>
                    <ChartCard
                        title="Platform fees"
                        description="Expected 2% protocol take. Not dest or game-developer fees."
                        className="lg:col-span-2"
                    >
                        <TrendChart
                            data={series}
                            xKey="bucket"
                            formatX={(value) => formatBucket(value, grain)}
                            series={[
                                {
                                    key: "platformFeesMicro",
                                    label: "Fees",
                                    color: "var(--color-gold)",
                                    format: formatMoney,
                                },
                            ]}
                        />
                    </ChartCard>
                </div>
            </section>

            {!scoped ? (
                <section className="space-y-4">
                    <SectionHeader
                        title="Onboarding funnel"
                        description="Cohort of users who joined in this window."
                    />
                    <Funnel report={report} />
                </section>
            ) : null}

            <section className="space-y-4">
                <SectionHeader
                    title="Retention"
                    description={report.definitions.returningUsers}
                />
                <div className="grid gap-4 sm:grid-cols-3">
                    <Card>
                        <CardContent className="p-5">
                            <Stat
                                label="Played this period"
                                value={formatCount(
                                    report.retention.usersWithPlay
                                )}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <Stat
                                label="Came back this period"
                                value={formatCount(
                                    report.retention.reactivatedUsers
                                )}
                                hint="First qualifying match was before this window"
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <Stat
                                label="Played on 2+ days"
                                value={formatCount(
                                    report.retention.repeatUsers
                                )}
                                hint={
                                    report.retention.repeatRate != null
                                        ? `${formatRate(report.retention.repeatRate)} of players this period`
                                        : undefined
                                }
                            />
                        </CardContent>
                    </Card>
                </div>
            </section>

            <section className="space-y-4">
                <SectionHeader
                    title="Revenue"
                    description={report.definitions.platformFee}
                />
                <div className="grid gap-4 lg:grid-cols-2">
                    <BreakdownTable
                        title="Fees by chain"
                        rows={report.feesByChain}
                        label={(key) =>
                            key === "solana" || key === "stacks"
                                ? chainAdapter(key).label
                                : key
                        }
                    />
                    <BreakdownTable
                        title="Fees by game"
                        rows={report.feesByGame}
                        label={gameName}
                    />
                </div>
            </section>

            <section className="space-y-4">
                <SectionHeader
                    title="Quest engagement"
                    description="Claim ledger only. Wars Points here are quest rewards, not match points."
                />
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <Card>
                        <CardContent className="p-5">
                            <Stat
                                label="Claims"
                                value={formatCount(report.quests.claims)}
                                hint={`${formatCount(report.quests.uniqueClaimers)} players`}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <Stat
                                label="Quest Wars Points"
                                value={formatCount(report.quests.pointsAwarded)}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <Stat
                                label="Getting Started claims"
                                value={formatCount(
                                    report.quests.gettingStartedClaims
                                )}
                            />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="p-5">
                            <Stat
                                label="Daily / weekly / monthly"
                                value={`${formatCount(report.quests.dailyClaims)} / ${formatCount(report.quests.weeklyClaims)} / ${formatCount(report.quests.monthlyClaims)}`}
                                hint={`${formatCount(report.quests.seasonalClaims)} seasonal · ${formatCount(report.quests.paidLadderClaims)} paid ladder`}
                            />
                        </CardContent>
                    </Card>
                </div>
            </section>

            {report.seasonComparison.length > 0 ? (
                <section className="space-y-4">
                    <SectionHeader
                        title="Season comparison"
                        description="Each row is that season’s own window. Activity columns respect chain and game filters."
                    />
                    <SeasonTable rows={report.seasonComparison} />
                </section>
            ) : null}

            <p className="max-w-3xl text-xs leading-relaxed text-muted-foreground">
                {report.definitions.qualifyingMatch} {report.definitions.volume}{" "}
                Account metrics (users, Getting Started, quest claims) are
                platform-wide and do not change when a chain or game is
                selected.
            </p>
        </div>
    )
}

function ChartCard({
    title,
    description,
    children,
    className,
}: {
    title: string
    description?: string
    children: React.ReactNode
    className?: string
}) {
    return (
        <Card className={className}>
            <CardHeader className="pb-2">
                <CardTitle className="text-base">{title}</CardTitle>
                {description ? (
                    <p className="text-xs text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
}

function Funnel({ report }: { report: AnalyticsReport }) {
    const steps = [
        {
            label: "Signups",
            value: report.funnel.signups,
            rate: 1,
        },
        {
            label: "Getting Started started",
            value: report.funnel.started,
            rate: report.funnel.startRate,
        },
        {
            label: "Getting Started completed",
            value: report.funnel.completed,
            rate: report.funnel.completeRate,
        },
    ]
    const max = Math.max(report.funnel.signups, 1)

    return (
        <Card>
            <CardContent className="space-y-5 p-6">
                {steps.map((step, index) => (
                    <div key={step.label} className="space-y-2">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-sm">
                                <span className="text-muted-foreground">
                                    {index + 1}.
                                </span>{" "}
                                {step.label}
                            </p>
                            <p className="tnum text-sm">
                                {formatCount(step.value)}
                                <span className="ml-2 text-muted-foreground">
                                    {formatRate(step.rate)} of signups
                                    {index === 2 &&
                                    report.funnel.completeOfStartedRate != null
                                        ? ` · ${formatRate(report.funnel.completeOfStartedRate)} of started`
                                        : null}
                                </span>
                            </p>
                        </div>
                        <Progress
                            value={(step.value / max) * 100}
                            tone={index === 2 ? "gold" : "primary"}
                        />
                    </div>
                ))}
            </CardContent>
        </Card>
    )
}

function BreakdownTable({
    title,
    rows,
    label,
}: {
    title: string
    rows: AnalyticsReport["feesByChain"]
    label: (key: string) => string
}) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {rows.length === 0 ? (
                    <EmptyState
                        title="No fee-bearing matches"
                        description="Platform fees only accrue when a paid match pays a winner."
                        className="py-8"
                    />
                ) : (
                    <table className="w-full text-sm">
                        <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                            <tr>
                                <th className="pb-2 font-medium">Source</th>
                                <th className="pb-2 text-right font-medium">
                                    Matches
                                </th>
                                <th className="pb-2 text-right font-medium">
                                    Volume
                                </th>
                                <th className="pb-2 text-right font-medium">
                                    Fees
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr
                                    key={row.key}
                                    className="border-t border-border/60"
                                >
                                    <td className="py-2.5">{label(row.key)}</td>
                                    <td className="tnum py-2.5 text-right">
                                        {formatCount(row.paidMatches)}
                                    </td>
                                    <td className="tnum py-2.5 text-right">
                                        {formatMoney(row.volumeMicro)}
                                    </td>
                                    <td className="tnum py-2.5 text-right text-gold">
                                        {formatMoney(row.platformFeesMicro)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </CardContent>
        </Card>
    )
}

function SeasonTable({ rows }: { rows: AnalyticsReport["seasonComparison"] }) {
    return (
        <Card>
            <CardContent className="overflow-x-auto p-0">
                <table className="w-full min-w-200 text-sm">
                    <thead className="text-left text-xs tracking-wide text-muted-foreground uppercase">
                        <tr className="border-b border-border/60">
                            <th className="px-5 py-3 font-medium">Season</th>
                            <th className="px-3 py-3 text-right font-medium">
                                New users
                            </th>
                            <th className="px-3 py-3 text-right font-medium">
                                Active
                            </th>
                            <th className="px-3 py-3 text-right font-medium">
                                Games
                            </th>
                            <th className="px-3 py-3 text-right font-medium">
                                Paid done
                            </th>
                            <th className="px-3 py-3 text-right font-medium">
                                Volume
                            </th>
                            <th className="px-5 py-3 text-right font-medium">
                                Fees
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr
                                key={row.seasonId}
                                className="border-b border-border/50 last:border-0"
                            >
                                <td className="px-5 py-3">
                                    <p>{row.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatDate(row.startsAt)} —{" "}
                                        {formatDate(row.endsAt)}
                                    </p>
                                </td>
                                <td className="tnum px-3 py-3 text-right">
                                    {formatCount(row.newUsers)}
                                </td>
                                <td className="tnum px-3 py-3 text-right">
                                    {formatCount(row.activeUsers)}
                                </td>
                                <td className="tnum px-3 py-3 text-right">
                                    {formatCount(row.gamesPlayed)}
                                </td>
                                <td className="tnum px-3 py-3 text-right">
                                    {formatCount(row.paidLobbiesCompleted)}
                                </td>
                                <td className="tnum px-3 py-3 text-right">
                                    {formatMoney(row.volumeMicro)}
                                </td>
                                <td className="tnum px-5 py-3 text-right text-gold">
                                    {formatMoney(row.platformFeesMicro)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </CardContent>
        </Card>
    )
}

function DashboardSkeleton() {
    return (
        <div className="space-y-8">
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                    <Skeleton key={i} className="h-28 rounded-2xl" />
                ))}
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-72 rounded-2xl" />
                <Skeleton className="h-72 rounded-2xl" />
            </div>
        </div>
    )
}
