import { Skeleton } from "@/components/ui"

export function RoomSkeleton() {
    return (
        <div className="space-y-6">
            <Skeleton className="h-28 rounded-2xl" />
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="space-y-4">
                    <Skeleton className="h-14 rounded-xl" />
                    <div className="grid gap-3 sm:grid-cols-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-20 rounded-xl" />
                        ))}
                    </div>
                </div>
                <Skeleton className="h-96 rounded-2xl" />
            </div>
        </div>
    )
}
