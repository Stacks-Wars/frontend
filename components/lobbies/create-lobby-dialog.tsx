"use client"

import { useRouter } from "next/navigation"
import * as React from "react"
import {
    RiLoader4Line,
    RiLockLine,
    RiRefreshLine,
    RiTrophyLine,
} from "@remixicon/react"

import { createLobbyAction } from "@/actions/lobbies"
import { getIncompletePaidCreateDraftAction } from "@/actions/vault-drafts"
import {
    Button,
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    Input,
    Label,
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
    Switch,
    Textarea,
} from "@/components/ui"
import type { VaultDraft } from "@/lib/api/server"
import type { GameMetadata } from "@/lib/api/types"
import { formatUsdc, toMicro, toUsdc } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useNotificationActions } from "@/stores/notifications"
import { useSessionBalance, useSessionUser } from "@/stores/session"

const ENTRY_PRESETS = [0, 1, 5, 25, 100]
const MIN_PAID_ENTRY_USD = 1

export type CreateLobbyDialogProps = {
    open: boolean
    onOpenChange: (open: boolean) => void
    games: GameMetadata[]
    /** Preselects a game and hides the picker when the caller already knows it. */
    gameId?: string
}

/**
 * The one place a lobby gets created. The games directory, a game page, and the
 * lobby browser all mount this same dialog.
 */
export function CreateLobbyDialog({
    open,
    onOpenChange,
    games,
    gameId,
}: CreateLobbyDialogProps) {
    const router = useRouter()
    const { toast } = useNotificationActions()
    const user = useSessionUser()
    const balance = useSessionBalance()

    const [picked, setPicked] = React.useState<string | null>(null)
    // Falls through to the catalogue default, which may arrive after mount.
    const selectedGame = picked ?? gameId ?? games[0]?.id ?? ""
    const [name, setName] = React.useState("")
    const [description, setDescription] = React.useState("")
    const [entryUsd, setEntryUsd] = React.useState("0")
    const [isPrivate, setIsPrivate] = React.useState(false)
    const [isSponsored, setIsSponsored] = React.useState(false)
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [draftLoading, setDraftLoading] = React.useState(false)
    const [incompleteDraft, setIncompleteDraft] =
        React.useState<VaultDraft | null>(null)

    const game = games.find((candidate) => candidate.id === selectedGame)
    const entryValue = Number.parseFloat(entryUsd)
    const entryUsdSafe = Number.isFinite(entryValue)
        ? Math.max(0, entryValue)
        : 0
    const entryMicro = toMicro(entryUsdSafe)
    const paid = entryMicro > 0

    const available = balance?.availableMicro ?? 0
    const underfunded = paid && entryMicro > available
    const belowMinimum = paid && entryUsdSafe < MIN_PAID_ENTRY_USD

    const disabled =
        submitting ||
        draftLoading ||
        Boolean(incompleteDraft) ||
        !selectedGame ||
        name.trim().length < 3 ||
        belowMinimum ||
        underfunded

    React.useEffect(() => {
        if (!open || !user) {
            setIncompleteDraft(null)
            setDraftLoading(false)
            return
        }

        let cancelled = false
        setDraftLoading(true)
        setError(null)
        void getIncompletePaidCreateDraftAction()
            .then((draft) => {
                if (cancelled) return
                setIncompleteDraft(draft)
                if (!draft) return
                // Prefill so a resume has sensible fallbacks if metadata is thin.
                if (draft.gameId) setPicked(draft.gameId)
                if (draft.name?.trim()) setName(draft.name.trim())
                if (draft.description) setDescription(draft.description)
                setEntryUsd(String(toUsdc(draft.entryAmountMicro)))
                setIsPrivate(Boolean(draft.isPrivate))
                setIsSponsored(
                    Boolean(draft.isSponsored ?? draft.sponsored)
                )
            })
            .catch(() => {
                if (!cancelled) setIncompleteDraft(null)
            })
            .finally(() => {
                if (!cancelled) setDraftLoading(false)
            })

        return () => {
            cancelled = true
        }
    }, [open, user])

    async function finishCreate(result: Awaited<ReturnType<typeof createLobbyAction>>) {
        if (!result.ok) {
            setError(
                `${result.error} Your on-chain entry is saved — tap Continue to finish without paying again.`
            )
            return
        }
        toast({
            title: "Lobby created",
            body:
                result.data.lobby.entryAmountMicro > 0
                    ? "Your entry is locked in the vault."
                    : undefined,
            tone: "success",
        })
        onOpenChange(false)
        setIncompleteDraft(null)
        setName("")
        setDescription("")
        setEntryUsd("0")
        router.push(`/room/${result.data.lobby.path}`)
    }

    async function continueIncomplete() {
        if (!incompleteDraft || submitting) return
        setSubmitting(true)
        setError(null)
        try {
            const result = await createLobbyAction({
                name:
                    incompleteDraft.name?.trim() ||
                    name.trim() ||
                    "Recovered lobby",
                description:
                    incompleteDraft.description ??
                    (description.trim() || undefined),
                gameId:
                    incompleteDraft.gameId || selectedGame || games[0]?.id || "",
                isPrivate: Boolean(incompleteDraft.isPrivate),
                isSponsored: Boolean(
                    incompleteDraft.isSponsored ?? incompleteDraft.sponsored
                ),
                entryAmountMicro: incompleteDraft.entryAmountMicro,
                resumeIncomplete: true,
            })
            await finishCreate(result)
        } catch {
            setError("Could not finish the lobby. Try Continue again.")
        } finally {
            setSubmitting(false)
        }
    }

    async function submit(event: React.FormEvent) {
        event.preventDefault()
        if (incompleteDraft) {
            await continueIncomplete()
            return
        }
        if (disabled) return

        setSubmitting(true)
        setError(null)
        try {
            const result = await createLobbyAction({
                name: name.trim(),
                description: description.trim() || undefined,
                gameId: selectedGame,
                isPrivate,
                isSponsored: isSponsored && paid,
                entryAmountMicro: entryMicro,
            })
            await finishCreate(result)
        } catch {
            setError("Could not create the lobby. Try again.")
        } finally {
            setSubmitting(false)
        }
    }

    const draftGame = games.find(
        (candidate) => candidate.id === incompleteDraft?.gameId
    )

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>
                        {incompleteDraft
                            ? "Finish your lobby"
                            : "Create a lobby"}
                    </DialogTitle>
                    <DialogDescription>
                        {incompleteDraft
                            ? "Your entry already confirmed on-chain. Continue to open the lobby without paying again."
                            : game
                              ? `${game.minPlayers}–${game.maxPlayers} players · ${game.name}`
                              : "Pick a game and set the stakes."}
                    </DialogDescription>
                </DialogHeader>

                {!user ? (
                    <div className="rounded-xl border border-border/70 bg-surface/50 p-4 text-sm text-muted-foreground">
                        Sign in to host a lobby.
                    </div>
                ) : draftLoading ? (
                    <div className="flex items-center gap-2 rounded-xl border border-border/70 px-4 py-6 text-sm text-muted-foreground">
                        <RiLoader4Line className="animate-spin" />
                        Checking for an unfinished paid lobby…
                    </div>
                ) : incompleteDraft ? (
                    <div className="space-y-5">
                        <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/10 p-4">
                            <p className="flex items-center gap-2 text-sm font-medium text-primary">
                                <RiRefreshLine className="size-4" />
                                Incomplete paid lobby
                            </p>
                            <dl className="grid gap-2 text-sm">
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Name
                                    </dt>
                                    <dd className="font-medium">
                                        {incompleteDraft.name?.trim() ||
                                            name.trim() ||
                                            "—"}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Game
                                    </dt>
                                    <dd className="font-medium">
                                        {draftGame?.name ||
                                            incompleteDraft.gameId ||
                                            "—"}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Entry
                                    </dt>
                                    <dd className="font-medium">
                                        {formatUsdc(
                                            incompleteDraft.entryAmountMicro
                                        )}
                                        {Boolean(
                                            incompleteDraft.isSponsored ??
                                                incompleteDraft.sponsored
                                        )
                                            ? " · sponsored"
                                            : ""}
                                    </dd>
                                </div>
                                <div className="flex justify-between gap-3">
                                    <dt className="text-muted-foreground">
                                        Path
                                    </dt>
                                    <dd className="font-mono text-xs">
                                        /{incompleteDraft.lobbyPath}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {error ? (
                            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {error}
                            </p>
                        ) : null}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                Later
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                disabled={submitting}
                                onClick={() => void continueIncomplete()}
                            >
                                {submitting ? (
                                    <RiLoader4Line className="animate-spin" />
                                ) : (
                                    <RiRefreshLine />
                                )}
                                Continue lobby
                            </Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={submit} className="space-y-5">
                        {!gameId ? (
                            <div className="grid gap-2">
                                <Label htmlFor="game">Game</Label>
                                <Select
                                    value={selectedGame}
                                    onValueChange={(value) =>
                                        setPicked(value as string)
                                    }
                                    items={Object.fromEntries(
                                        games.map((option) => [
                                            option.id,
                                            option.name,
                                        ])
                                    )}
                                >
                                    <SelectTrigger id="game">
                                        <SelectValue placeholder="Choose a game" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {games.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                value={option.id}
                                            >
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        ) : null}

                        <div className="grid gap-2">
                            <Label htmlFor="lobby-name">Lobby name</Label>
                            <Input
                                id="lobby-name"
                                value={name}
                                onChange={(event) =>
                                    setName(event.target.value)
                                }
                                placeholder="Friday night runback"
                                maxLength={60}
                                autoFocus
                            />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="lobby-description">
                                Description
                                <span className="ml-1 text-xs font-normal text-muted-foreground">
                                    optional
                                </span>
                            </Label>
                            <Textarea
                                id="lobby-description"
                                value={description}
                                onChange={(event) =>
                                    setDescription(event.target.value)
                                }
                                rows={2}
                                maxLength={180}
                                placeholder="House rules, who it's for, anything else."
                            />
                        </div>

                        <div className="grid gap-2.5">
                            <Label htmlFor="entry">Entry fee</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {ENTRY_PRESETS.map((preset) => (
                                    <button
                                        key={preset}
                                        type="button"
                                        onClick={() =>
                                            setEntryUsd(String(preset))
                                        }
                                        className={cn(
                                            "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                                            entryUsdSafe === preset
                                                ? "border-primary bg-primary/15 text-primary"
                                                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground"
                                        )}
                                    >
                                        {preset === 0 ? "Free" : `$${preset}`}
                                    </button>
                                ))}
                            </div>
                            <Input
                                id="entry"
                                type="number"
                                min="0"
                                step="0.5"
                                value={entryUsd}
                                onChange={(event) =>
                                    setEntryUsd(event.target.value)
                                }
                                aria-invalid={
                                    belowMinimum || underfunded
                                        ? true
                                        : undefined
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                {paid ? (
                                    <>
                                        Held in the on-chain vault until the
                                        match settles. Balance{" "}
                                        {formatUsdc(available, {
                                            zero: "$0.00",
                                        })}
                                        .
                                    </>
                                ) : (
                                    "Free lobbies award season points but no payout."
                                )}
                            </p>
                            {belowMinimum ? (
                                <p className="text-xs text-destructive">
                                    Paid lobbies start at $1.
                                </p>
                            ) : null}
                            {underfunded ? (
                                <p className="text-xs text-destructive">
                                    Not enough balance — fund your wallet first.
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-3 rounded-xl border border-border/70 p-4">
                            <label className="flex items-start gap-3">
                                <Switch
                                    checked={isPrivate}
                                    onCheckedChange={setIsPrivate}
                                />
                                <span className="space-y-0.5">
                                    <span className="flex items-center gap-1.5 text-sm font-medium">
                                        <RiLockLine className="size-3.5" />
                                        Private lobby
                                    </span>
                                    <span className="block text-xs text-muted-foreground">
                                        Shown with a lock in the browser. Others
                                        request to join.
                                    </span>
                                </span>
                            </label>

                            {paid ? (
                                <label className="flex items-start gap-3">
                                    <Switch
                                        checked={isSponsored}
                                        onCheckedChange={setIsSponsored}
                                    />
                                    <span className="space-y-0.5">
                                        <span className="flex items-center gap-1.5 text-sm font-medium">
                                            <RiTrophyLine className="size-3.5" />
                                            Sponsor the pot
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            You cover every entry — others join
                                            for free.
                                        </span>
                                    </span>
                                </label>
                            ) : null}
                        </div>

                        {error ? (
                            <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                                {error}
                            </p>
                        ) : null}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={disabled}
                            >
                                {submitting ? (
                                    <RiLoader4Line className="animate-spin" />
                                ) : null}
                                {paid
                                    ? `Create · ${formatUsdc(entryMicro)}`
                                    : "Create lobby"}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
