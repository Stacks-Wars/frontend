import { Badge } from "@/components/ui"
import type { LobbyStatus } from "@/lib/api/types"

const LABELS: Record<
    LobbyStatus,
    { label: string; variant: "primary" | "warning" | "live" | "outline" }
> = {
    waiting: { label: "Open", variant: "primary" },
    starting: { label: "Starting", variant: "warning" },
    inProgress: { label: "Live", variant: "live" },
    finished: { label: "Ended", variant: "outline" },
}

export function LobbyStatusBadge({
    status,
    className,
}: {
    status: LobbyStatus
    className?: string
}) {
    const { label, variant } = LABELS[status]
    return (
        <Badge variant={variant} className={className}>
            {label}
        </Badge>
    )
}

export function statusLabel(status: LobbyStatus): string {
    return LABELS[status].label
}
