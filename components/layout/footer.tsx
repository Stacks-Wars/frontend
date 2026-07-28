import Link from "next/link"

export function Footer() {
    return (
        <footer className="border-t border-border/60">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 sm:flex-row sm:items-end sm:justify-between sm:px-6">
                <div>
                    <p className="font-display text-2xl tracking-tight">
                        Stacks Wars
                    </p>
                    <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                        Compete in skill-based arenas. Climb the board. Claim
                        the season.
                    </p>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                    <Link href="/games" className="hover:text-foreground">
                        Games
                    </Link>
                    <Link href="/lobby" className="hover:text-foreground">
                        Lobby
                    </Link>
                    <Link href="/leaderboard" className="hover:text-foreground">
                        Leaderboard
                    </Link>
                </div>
            </div>
        </footer>
    )
}
