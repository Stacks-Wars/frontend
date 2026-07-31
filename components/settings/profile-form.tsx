"use client"

import * as React from "react"
import { RiCheckLine, RiCloseLine, RiLoader4Line } from "@remixicon/react"

import {
    checkUsernameAvailableAction,
    updateMyProfileAction,
} from "@/actions/profile-settings"
import { Button, Input, Label } from "@/components/ui"
import type { AppUser } from "@/lib/api/types"
import { useNotificationsStore } from "@/stores/notifications"
import { useSessionStore } from "@/stores/session"

/** Mirrors the API's `validate_username`. */
const USERNAME_PATTERN = /^[a-z][a-z0-9_-]{2,23}$/
const USERNAME_RULES =
    "3–24 characters. Lowercase letters, numbers, _ and -, starting with a letter."
const CHECK_DEBOUNCE_MS = 400

/** Both outcomes carry their username so a stale reply is simply ignored. */
type CheckResult = { username: string; available: boolean; reason?: string }
type CheckFailure = { username: string; message: string }

export function ProfileForm({ user }: { user: AppUser }) {
    const setUser = useSessionStore((s) => s.setUser)
    const toast = useNotificationsStore((s) => s.toast)

    const [username, setUsername] = React.useState(user.username ?? "")
    const [displayName, setDisplayName] = React.useState(user.displayName ?? "")
    const [avatarUrl, setAvatarUrl] = React.useState(user.avatarUrl ?? "")
    const [submitting, setSubmitting] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)
    const [checked, setChecked] = React.useState<CheckResult | null>(null)
    const [checkFailure, setCheckFailure] = React.useState<CheckFailure | null>(
        null
    )

    const currentUsername = user.username ?? ""
    const nextUsername = username.trim().toLowerCase()
    const nextDisplayName = displayName.trim()
    const nextAvatarUrl = avatarUrl.trim()

    const usernameInvalid =
        nextUsername.length > 0 && !USERNAME_PATTERN.test(nextUsername)
    const usernameChanged =
        nextUsername.length > 0 && nextUsername !== currentUsername
    const avatarInvalid =
        nextAvatarUrl.length > 0 && !/^https?:\/\/\S+$/.test(nextAvatarUrl)
    const displayNameChanged =
        nextDisplayName.length > 0 &&
        nextDisplayName !== (user.displayName ?? "")
    const avatarChanged =
        nextAvatarUrl.length > 0 && nextAvatarUrl !== (user.avatarUrl ?? "")

    const needsCheck = usernameChanged && !usernameInvalid

    React.useEffect(() => {
        if (!needsCheck) return

        let cancelled = false
        const timer = window.setTimeout(() => {
            checkUsernameAvailableAction(nextUsername)
                .then((result) => {
                    if (cancelled) return
                    setChecked({
                        username: nextUsername,
                        available: result.available,
                        reason: result.reason,
                    })
                })
                .catch((err: unknown) => {
                    if (cancelled) return
                    setCheckFailure({
                        username: nextUsername,
                        message:
                            err instanceof Error
                                ? err.message
                                : "Could not check that username.",
                    })
                })
        }, CHECK_DEBOUNCE_MS)

        return () => {
            cancelled = true
            window.clearTimeout(timer)
        }
    }, [needsCheck, nextUsername])

    const result = checked?.username === nextUsername ? checked : null
    const failure =
        checkFailure?.username === nextUsername ? checkFailure : null
    const checking = needsCheck && !result && !failure

    const dirty = usernameChanged || displayNameChanged || avatarChanged
    const disabled =
        submitting ||
        !dirty ||
        usernameInvalid ||
        avatarInvalid ||
        (usernameChanged && !result?.available)

    async function submit(event: React.FormEvent) {
        event.preventDefault()
        if (disabled) return

        setSubmitting(true)
        setError(null)
        try {
            const updated = await updateMyProfileAction({
                username: usernameChanged ? nextUsername : null,
                displayName: displayNameChanged ? nextDisplayName : null,
                avatarUrl: avatarChanged ? nextAvatarUrl : null,
            })
            setUser(updated)
            setUsername(updated.username ?? "")
            setDisplayName(updated.displayName ?? "")
            setAvatarUrl(updated.avatarUrl ?? "")
            toast({ title: "Profile updated", tone: "success" })
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Could not save your profile."
            )
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <form
            onSubmit={submit}
            className="space-y-5 rounded-2xl border border-border/70 p-5 surface-raised"
        >
            <div className="grid gap-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                    <Input
                        id="username"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="quickdraw"
                        maxLength={24}
                        autoComplete="off"
                        spellCheck={false}
                        className="pr-10"
                        aria-invalid={usernameInvalid ? true : undefined}
                    />
                    <span className="absolute top-1/2 right-3 -translate-y-1/2">
                        {checking ? (
                            <RiLoader4Line className="size-4 animate-spin text-muted-foreground" />
                        ) : result?.available ? (
                            <RiCheckLine className="size-4 text-success" />
                        ) : usernameInvalid || result ? (
                            <RiCloseLine className="size-4 text-destructive" />
                        ) : null}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    {USERNAME_RULES}
                </p>
                <p className="text-xs text-muted-foreground">
                    Claiming a username is what makes your public profile at{" "}
                    <span className="font-mono whitespace-nowrap">
                        /profile/{nextUsername || "username"}
                    </span>{" "}
                    reachable.
                </p>
                {usernameInvalid ? (
                    <p className="text-xs text-destructive">
                        That username does not match the rules above.
                    </p>
                ) : result?.available ? (
                    <p className="text-xs text-success">
                        {nextUsername} is available.
                    </p>
                ) : result ? (
                    <p className="text-xs text-destructive">
                        {result.reason ?? `${nextUsername} is already taken.`}
                    </p>
                ) : failure ? (
                    <p className="text-xs text-destructive">
                        {failure.message}
                    </p>
                ) : currentUsername && !nextUsername ? (
                    <p className="text-xs text-muted-foreground">
                        A claimed username cannot be removed.
                    </p>
                ) : null}
            </div>

            <div className="grid gap-2">
                <Label htmlFor="display-name">Display name</Label>
                <Input
                    id="display-name"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Shown on rosters and results"
                    maxLength={60}
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="avatar-url">Avatar URL</Label>
                <Input
                    id="avatar-url"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
                    placeholder="https://…"
                    inputMode="url"
                    aria-invalid={avatarInvalid ? true : undefined}
                />
                {avatarInvalid ? (
                    <p className="text-xs text-destructive">
                        Enter a full http or https image URL.
                    </p>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        Falls back to a generated avatar when empty.
                    </p>
                )}
            </div>

            {error ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            ) : null}

            <div className="flex items-center gap-3">
                <Button type="submit" variant="primary" disabled={disabled}>
                    {submitting ? (
                        <RiLoader4Line className="animate-spin" />
                    ) : null}
                    Save changes
                </Button>
                {!dirty ? (
                    <span className="text-xs text-muted-foreground">
                        Nothing to save.
                    </span>
                ) : null}
            </div>
        </form>
    )
}
