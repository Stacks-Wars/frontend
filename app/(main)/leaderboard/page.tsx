const podium = [
    { rank: 1, name: "Arena Champ", points: "—" },
    { rank: 2, name: "Rising Blade", points: "—" },
    { rank: 3, name: "Night Runner", points: "—" },
]

export default function LeaderboardPage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-display text-4xl tracking-tight">
                Leaderboard
            </h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
                Season standings — Wars Points and podium UI ready for live
                stats.
            </p>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
                {podium.map((entry) => (
                    <div
                        key={entry.rank}
                        className="rounded-2xl border border-border/70 bg-linear-to-b from-primary/25 to-card px-5 py-8 text-center"
                    >
                        <p className="text-sm text-muted-foreground">
                            #{entry.rank}
                        </p>
                        <p className="mt-2 font-display text-2xl">
                            {entry.name}
                        </p>
                        <p className="mt-3 text-secondary">{entry.points} WP</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
