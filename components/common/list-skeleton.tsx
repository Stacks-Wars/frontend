import { Skeleton } from "@/components/ui"
import { cn } from "@/lib/utils"

/** Route-level placeholder: a page header, a filter bar, then a card grid. */
export function ListPageSkeleton({
    cards = 6,
    columns = "sm:grid-cols-2 xl:grid-cols-3",
}: {
    cards?: number
    columns?: string
}) {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <Skeleton className="h-9 w-52" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <Skeleton className="h-11 rounded-xl" />
            <div className={cn("grid gap-4", columns)}>
                {Array.from({ length: cards }).map((_, index) => (
                    <Skeleton key={index} className="h-56 rounded-2xl" />
                ))}
            </div>
        </div>
    )
}

export function TablePageSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <Skeleton className="h-9 w-52" />
                <Skeleton className="h-4 w-80 max-w-full" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-9 w-40" />
                <Skeleton className="h-9 w-44" />
            </div>
            <div className="space-y-2">
                {Array.from({ length: rows }).map((_, index) => (
                    <Skeleton key={index} className="h-14 rounded-xl" />
                ))}
            </div>
        </div>
    )
}
