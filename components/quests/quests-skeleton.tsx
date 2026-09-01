import { Skeleton } from "@/components/ui"

export function QuestsSkeleton() {
    return (
        <div className="flex flex-col gap-12 xl:grid xl:grid-cols-[minmax(0,1fr)_19rem] xl:items-start">
            <div className="space-y-8 xl:col-start-1 xl:row-start-1">
                <Skeleton className="h-4 w-48" />
                <div className="space-y-4">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-7 w-40" />
                    <ol className="space-y-0">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <li key={i} className="flex gap-4">
                                <div className="flex w-5 shrink-0 flex-col items-center">
                                    <Skeleton className="size-5 rounded-full" />
                                    {i < 3 ? (
                                        <span className="mt-1 w-px flex-1 bg-border" />
                                    ) : null}
                                </div>
                                <div
                                    className={`min-w-0 flex-1 space-y-2 ${i < 3 ? "pb-6" : ""}`}
                                >
                                    <div className="flex justify-between gap-3">
                                        <Skeleton className="h-4 w-3/5" />
                                        <Skeleton className="h-4 w-14" />
                                    </div>
                                    <Skeleton className="h-1.5 w-full rounded-full" />
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </div>
            <aside className="space-y-10 xl:col-start-2 xl:row-start-1 xl:row-span-2">
                <div className="flex flex-col gap-6">
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-32" />
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-3 w-28" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-8 w-12" />
                    </div>
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-3 w-28" />
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-1.5 w-full rounded-full" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                </div>
            </aside>
            <div className="space-y-12 xl:col-start-1 xl:row-start-2">
                {Array.from({ length: 3 }).map((_, section) => (
                    <div key={section} className="space-y-4">
                        <div className="flex items-end justify-between">
                            <Skeleton className="h-7 w-28" />
                            <Skeleton className="h-3 w-10" />
                        </div>
                        <ol>
                            {Array.from({ length: 3 }).map((_, i) => (
                                <li key={i} className="flex gap-4">
                                    <div className="flex w-5 shrink-0 flex-col items-center">
                                        <Skeleton className="size-5 rounded-full" />
                                        {i < 2 ? (
                                            <span className="mt-1 w-px flex-1 bg-border" />
                                        ) : null}
                                    </div>
                                    <div
                                        className={`min-w-0 flex-1 space-y-2 ${i < 2 ? "pb-6" : ""}`}
                                    >
                                        <div className="flex justify-between gap-3">
                                            <Skeleton className="h-4 w-2/3" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                        <Skeleton className="h-1.5 w-full rounded-full" />
                                    </div>
                                </li>
                            ))}
                        </ol>
                    </div>
                ))}
            </div>
        </div>
    )
}
