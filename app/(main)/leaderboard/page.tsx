import { getCurrentSeason, getLeaderboard } from "@/lib/api/server"

function displayName(entry: {
    displayName: string | null
    username: string | null
    userId: string
}) {
    return entry.displayName ?? entry.username ?? entry.userId.slice(0, 8)
}

export default async function LeaderboardPage() {
    const season = await getCurrentSeason()
    const board = season
        ? await getLeaderboard({ seasonId: season.id, limit: 50 })
        : await getLeaderboard({ limit: 50 }).catch(() => null)

    const items = board?.items ?? []
    const top = items.slice(0, 3)

    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-display text-4xl tracking-tight">
                Leaderboard
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
                {season
                    ? `${season.name} standings — overall Wars Points.`
                    : "Season standings — overall Wars Points."}
            </p>

            {top.length > 0 ? (
                <div className="mt-10 grid gap-4 md:grid-cols-3">
                    {top.map((entry) => (
                        <div
                            key={entry.userId}
                            className="rounded-2xl border border-border/70 bg-linear-to-b from-primary/25 to-card px-5 py-8 text-center"
                        >
                            <p className="text-sm text-muted-foreground">
                                #{entry.rank}
                            </p>
                            <p className="mt-2 font-display text-2xl">
                                {displayName(entry)}
                            </p>
                            <p className="mt-3 text-secondary">
                                {entry.points} WP
                            </p>
                        </div>
                    ))}
                </div>
            ) : null}

            <div className="mt-10 overflow-x-auto">
                <table className="w-full min-w-xl text-left text-sm">
                    <thead className="border-b border-border/70 text-muted-foreground">
                        <tr>
                            <th className="px-2 py-3 font-medium">Rank</th>
                            <th className="px-2 py-3 font-medium">Player</th>
                            <th className="px-2 py-3 font-medium">Points</th>
                            <th className="px-2 py-3 font-medium">Matches</th>
                            <th className="px-2 py-3 font-medium">Wins</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((entry) => (
                            <tr
                                key={entry.userId}
                                className="border-b border-border/40"
                            >
                                <td className="px-2 py-3">{entry.rank}</td>
                                <td className="px-2 py-3">
                                    {displayName(entry)}
                                </td>
                                <td className="px-2 py-3">{entry.points}</td>
                                <td className="px-2 py-3">
                                    {entry.totalMatches}
                                </td>
                                <td className="px-2 py-3">{entry.totalWins}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {items.length === 0 ? (
                    <p className="mt-6 text-sm text-muted-foreground">
                        No standings yet for this season.
                    </p>
                ) : null}
            </div>
        </div>
    )
}
