"use client"

import * as React from "react"
import { RiSendPlane2Line } from "@remixicon/react"

import { Button, Input } from "@/components/ui"
import type { LobbyChatMessage } from "@/lib/api/types"
import { displayNameFor } from "@/lib/format"
import { cn } from "@/lib/utils"

export function RoomChat({
    messages,
    selfUserId,
    canSend,
    onSend,
    className,
}: {
    messages: LobbyChatMessage[]
    selfUserId: string | null
    canSend: boolean
    onSend: (body: string) => void
    className?: string
}) {
    const [draft, setDraft] = React.useState("")
    const scrollerRef = React.useRef<HTMLDivElement>(null)

    // Keep the newest message in view without scrolling the page itself.
    React.useEffect(() => {
        const node = scrollerRef.current
        if (!node) return
        node.scrollTop = node.scrollHeight
    }, [messages.length])

    function submit(event: React.FormEvent) {
        event.preventDefault()
        const body = draft.trim()
        if (!body || !canSend) return
        onSend(body)
        setDraft("")
    }

    return (
        <div
            className={cn(
                "flex h-[520px] min-h-0 shrink-0 flex-col overflow-hidden rounded-2xl border border-border/70 surface-raised",
                className
            )}
        >
            <p className="shrink-0 border-b border-border/60 px-4 py-2.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                Room chat
            </p>

            <div
                ref={scrollerRef}
                className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-3"
            >
                {messages.length === 0 ? (
                    <p className="py-8 text-center text-sm text-muted-foreground">
                        No messages yet. Say hello.
                    </p>
                ) : (
                    messages.map((message) => {
                        const mine = message.userId === selfUserId
                        return (
                            <div key={message.id} className="space-y-0.5">
                                <p
                                    className={cn(
                                        "text-xs",
                                        mine
                                            ? "text-primary"
                                            : "text-muted-foreground"
                                    )}
                                >
                                    {mine ? "You" : displayNameFor(message)}
                                </p>
                                <p className="text-sm break-words">
                                    {message.body}
                                </p>
                            </div>
                        )
                    })
                )}
            </div>

            <form
                onSubmit={submit}
                className="flex shrink-0 gap-2 border-t border-border/60 p-3"
            >
                <Input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder={canSend ? "Message the room" : "Join to chat"}
                    disabled={!canSend}
                    maxLength={280}
                    aria-label="Chat message"
                />
                <Button
                    type="submit"
                    size="icon"
                    variant="primary"
                    disabled={!canSend || draft.trim().length === 0}
                    aria-label="Send"
                >
                    <RiSendPlane2Line />
                </Button>
            </form>
        </div>
    )
}
