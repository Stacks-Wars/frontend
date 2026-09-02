"use client"

import Link from "next/link"
import { RiNotification3Line } from "@remixicon/react"

import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui"
import { timeAgo } from "@/lib/format"
import {
    useNotificationActions,
    useNotificationItems,
} from "@/stores/notifications"

export function NotificationsMenu() {
    const items = useNotificationItems()
    const { markAllRead, markRead } = useNotificationActions()
    const unread = items.filter((item) => !item.read).length

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                render={
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Notifications"
                        className="relative"
                    />
                }
            >
                <RiNotification3Line />
                {unread > 0 ? (
                    <span className="absolute top-1.5 right-1.5 grid min-w-4 place-items-center rounded-full bg-live px-1 text-[10px] leading-4 font-semibold text-background">
                        {unread > 9 ? "9+" : unread}
                    </span>
                ) : null}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80 p-0">
                <div className="flex items-center justify-between px-3 py-2.5">
                    <p className="text-sm font-medium">Notifications</p>
                    {unread > 0 ? (
                        <button
                            type="button"
                            onClick={markAllRead}
                            className="text-xs text-primary hover:underline"
                        >
                            Mark all read
                        </button>
                    ) : null}
                </div>
                <DropdownMenuSeparator className="mx-0 my-0" />
                {items.length === 0 ? (
                    <p className="px-3 py-8 text-center text-sm text-muted-foreground">
                        Nothing yet. Match results, quests, and payouts land
                        here.
                    </p>
                ) : (
                    <div className="max-h-80 overflow-y-auto p-1">
                        {items.slice(0, 12).map((item) => (
                            <DropdownMenuItem
                                key={item.id}
                                onClick={() => markRead(item.id)}
                                render={
                                    item.href ? (
                                        <Link href={item.href} />
                                    ) : undefined
                                }
                                className="flex-col items-start gap-0.5"
                            >
                                <span className="flex w-full items-center gap-2">
                                    {!item.read ? (
                                        <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                                    ) : null}
                                    <span className="truncate text-sm">
                                        {item.title}
                                    </span>
                                </span>
                                {item.body ? (
                                    <span className="line-clamp-2 text-xs text-muted-foreground">
                                        {item.body}
                                    </span>
                                ) : null}
                                <span className="text-xs text-muted-foreground">
                                    {timeAgo(item.createdAt)}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
