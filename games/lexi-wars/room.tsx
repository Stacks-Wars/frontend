"use client"

import * as React from "react"
import { RiSendPlane2Line } from "@remixicon/react"

import type {
    ClientRule,
    LexiWarsEvent,
    LexiWarsSnapshot,
} from "@/games/lexi-wars/protocol"
import { EventFeed, useEventFeed } from "@/games/shared/event-feed"
import { GameShell } from "@/games/shared/game-shell"
import { PlayerRail } from "@/games/shared/player-rail"
import { TurnBar } from "@/games/shared/turn-bar"
import type { GameRoomProps } from "@/games/types"
import { Button, Input } from "@/components/ui"
import { displayNameFor } from "@/lib/format"
import { cn } from "@/lib/utils"

export function LexiWarsRoom({
    players,
    selfUserId,
    initialState,
    channel,
    connection,
}: GameRoomProps) {
    const snapshot = initialState as LexiWarsSnapshot | null
    const [turn, setTurn] = React.useState(snapshot?.turn ?? null)
    const [rule, setRule] = React.useState<ClientRule | null>(
        snapshot?.rule?.rule ?? null
    )
    const [remaining, setRemaining] = React.useState(
        snapshot?.playersCount?.remaining ?? players.length
    )
    const [eliminated, setEliminated] = React.useState<Set<string>>(new Set())
    const [words, setWords] = React.useState<string[]>([])
    const [draft, setDraft] = React.useState("")
    const [error, setError] = React.useState<string | null>(null)
    const [pending, setPending] = React.useState(false)
    const { lines, push } = useEventFeed()
    const inputRef = React.useRef<HTMLInputElement>(null)

    React.useEffect(() => {
        return channel.on((raw) => {
            const event = raw as LexiWarsEvent
            switch (event.type) {
                case "turn":
                    setTurn(event)
                    setError(null)
                    setPending(false)
                    break
                case "rule":
                    setRule(event.rule)
                    break
                case "wordEntry":
                    setWords((prev) => [event.word, ...prev].slice(0, 40))
                    push(
                        `${displayNameFor(event.player)} played "${event.word}"`
                    )
                    setPending(false)
                    break
                case "usedWord":
                    setError(`"${event.word}" has already been played`)
                    setPending(false)
                    break
                case "invalid":
                    setError(event.reason)
                    setPending(false)
                    break
                case "eliminated":
                    setEliminated((prev) =>
                        new Set(prev).add(event.player.userId)
                    )
                    push(
                        `${displayNameFor(event.player)} is out — ${event.reason}`,
                        "bad"
                    )
                    break
                case "playersCount":
                    setRemaining(event.remaining)
                    break
                default:
                    break
            }
        })
    }, [channel, push])

    const isMyTurn = turn?.player.userId === selfUserId
    const canPlay = isMyTurn && connection === "open" && !pending

    React.useEffect(() => {
        if (isMyTurn) inputRef.current?.focus()
    }, [isMyTurn, turn?.player.userId])

    function submit(event: React.FormEvent) {
        event.preventDefault()
        const word = draft.trim().toLowerCase()
        if (!word || !canPlay) return
        channel.send({ type: "submitWord", word })
        setDraft("")
        setPending(true)
        setError(null)
    }

    return (
        <GameShell
            banner={
                <TurnBar
                    name={turn ? displayNameFor(turn.player) : null}
                    isYou={Boolean(isMyTurn)}
                    timeoutSecs={isMyTurn ? turn?.timeoutSecs : null}
                    resetKey={
                        turn
                            ? `${turn.player.userId}-${turn.timeoutSecs}`
                            : "idle"
                    }
                    hint={`${remaining} still standing`}
                />
            }
            stage={
                <div className="flex w-full max-w-xl flex-col items-center gap-6 py-2">
                    <div
                        className={cn(
                            "w-full rounded-2xl border px-5 py-6 text-center transition-colors",
                            isMyTurn && rule
                                ? "border-primary/50 bg-primary/10"
                                : "border-border/70 bg-surface/40"
                        )}
                    >
                        {rule ? (
                            <>
                                <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                                    {rule.name}
                                </p>
                                <p className="mt-2 font-display text-xl sm:text-2xl">
                                    {rule.description}
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                {isMyTurn
                                    ? "Waiting for your rule…"
                                    : "The rule is revealed to whoever is on the clock."}
                            </p>
                        )}
                    </div>

                    <form onSubmit={submit} className="flex w-full gap-2">
                        <Input
                            ref={inputRef}
                            value={draft}
                            onChange={(event) => setDraft(event.target.value)}
                            disabled={!canPlay}
                            placeholder={
                                isMyTurn
                                    ? "Type a word and hit enter"
                                    : "Wait for your turn"
                            }
                            autoComplete="off"
                            spellCheck={false}
                            className="h-12 text-base"
                            aria-invalid={error ? true : undefined}
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            disabled={!canPlay || draft.trim().length === 0}
                        >
                            <RiSendPlane2Line />
                            <span className="hidden sm:inline">Play</span>
                        </Button>
                    </form>

                    {error ? (
                        <p className="animate-pop-in text-sm text-destructive">
                            {error}
                        </p>
                    ) : null}

                    <div className="flex w-full flex-wrap justify-center gap-1.5">
                        {words.slice(0, 18).map((word, index) => (
                            <span
                                key={`${word}-${index}`}
                                className="stagger animate-pop-in rounded-md bg-muted px-2 py-1 text-xs"
                                style={
                                    { "--index": index } as React.CSSProperties
                                }
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            }
            rail={
                <>
                    <PlayerRail
                        selfUserId={selfUserId}
                        players={players.map((player) => ({
                            userId: player.userId,
                            name: displayNameFor(player),
                            active: turn?.player.userId === player.userId,
                            eliminated: eliminated.has(player.userId),
                        }))}
                    />
                    <EventFeed
                        lines={lines}
                        emptyLabel="Waiting for the first word…"
                    />
                </>
            }
        />
    )
}

export function LexiWarsLobbyPanel() {
    return (
        <div className="space-y-2 rounded-xl border border-border/70 p-4 surface-raised">
            <p className="font-display text-sm">How Lexi Wars plays here</p>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li>Each turn comes with a rule only the active player sees.</li>
                <li>Submit a word that satisfies it before the clock runs out.</li>
                <li>Repeats and rule breaks cost you the turn.</li>
                <li>Miss the clock and you are eliminated. Last one standing wins.</li>
            </ul>
        </div>
    )
}
