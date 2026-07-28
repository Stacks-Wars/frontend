export default function LobbyPage() {
    return (
        <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
            <h1 className="font-display text-4xl tracking-tight">Lobby</h1>
            <p className="mt-2 max-w-xl text-muted-foreground">
                Live lobby browser. WebSocket feed and join flows land here.
            </p>
            <div className="mt-10 grid gap-3">
                {[1, 2, 3].map((slot) => (
                    <div
                        key={slot}
                        className="flex items-center justify-between rounded-2xl border border-dashed border-border/80 bg-card/40 px-5 py-6"
                    >
                        <div>
                            <p className="font-medium">Open lobby slot</p>
                            <p className="text-sm text-muted-foreground">
                                Waiting for realtime lobby data
                            </p>
                        </div>
                        <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-medium text-primary">
                            Soon
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}
