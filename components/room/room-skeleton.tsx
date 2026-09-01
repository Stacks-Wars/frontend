import { Skeleton } from "@/components/ui"

export function RoomSkeleton() {
    return (
        <div className="space-y-6">
            <header className="space-y-4 rounded-2xl border border-border/70 p-5 surface-raised sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                        <Skeleton className="h-8 w-28 rounded-lg" />
                        <div className="flex flex-wrap items-center gap-2">
                            <Skeleton className="h-8 w-48 sm:h-9 sm:w-64" />
                            <Skeleton className="h-5 w-16 rounded-md" />
                        </div>
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded-lg" />
                </div>
                <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-border/60 pt-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="space-y-1">
                            <Skeleton className="h-3 w-10" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    ))}
                </dl>
            </header>

            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
                <div className="min-w-0 space-y-6">
                    <section className="space-y-4">
                        <div className="space-y-1">
                            <Skeleton className="h-7 w-16" />
                            <Skeleton className="h-4 w-52" />
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 rounded-xl border border-border/70 p-3 surface-raised"
                                >
                                    <Skeleton className="size-8 shrink-0 rounded-full" />
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <div className="rounded-2xl border border-border/70 p-4 surface-raised">
                        <div className="flex items-center justify-between gap-3">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-10 w-28 rounded-lg" />
                        </div>
                    </div>
                </div>
                <div className="flex h-[520px] flex-col overflow-hidden rounded-2xl border border-border/70 surface-raised">
                    <div className="border-b border-border/60 px-4 py-2.5">
                        <Skeleton className="h-3 w-20" />
                    </div>
                    <div className="min-h-0 flex-1 space-y-3 px-4 py-3">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="ml-auto h-3 w-12" />
                        <Skeleton className="ml-auto h-4 w-32" />
                    </div>
                    <div className="flex gap-2 border-t border-border/60 p-3">
                        <Skeleton className="h-10 flex-1 rounded-lg" />
                        <Skeleton className="size-10 shrink-0 rounded-lg" />
                    </div>
                </div>
            </div>
        </div>
    )
}
