import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui"
import { displayNameFor } from "@/lib/format"
import { cn } from "@/lib/utils"

type Identity = {
    userId?: string
    id?: string
    username?: string | null
    displayName?: string | null
    avatarUrl?: string | null
}

/** Profile links only exist for users who have claimed a username. */
export function profileHref(user: Identity): string | null {
    return user.username ? `/profile/${user.username}` : null
}

export function UserChip({
    user,
    size = "sm",
    subtitle,
    className,
    linked = true,
}: {
    user: Identity
    size?: "xs" | "sm" | "default" | "lg"
    subtitle?: React.ReactNode
    className?: string
    linked?: boolean
}) {
    const name = displayNameFor(user)
    const href = linked ? profileHref(user) : null

    const body = (
        <span className={cn("flex min-w-0 items-center gap-2.5", className)}>
            <Avatar size={size}>
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback seed={name} />
            </Avatar>
            <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium">{name}</span>
                {subtitle ? (
                    <span className="truncate text-xs text-muted-foreground">
                        {subtitle}
                    </span>
                ) : null}
            </span>
        </span>
    )

    if (!href) return body

    return (
        <Link href={href} className="min-w-0 hover:text-primary">
            {body}
        </Link>
    )
}
