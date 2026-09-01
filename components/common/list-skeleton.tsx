import { Skeleton } from "@/components/ui"
import { cn } from "@/lib/utils"

export function PageHeaderSkeleton({
    eyebrow = false,
    action = false,
}: {
    eyebrow?: boolean
    action?: boolean
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
                {eyebrow ? <Skeleton className="h-3 w-24" /> : null}
                <Skeleton className="h-9 w-56 sm:h-10 sm:w-72" />
                <Skeleton className="h-4 w-full max-w-md" />
            </div>
            {action ? <Skeleton className="h-10 w-32 rounded-lg" /> : null}
        </header>
    )
}

export function GameCardSkeleton() {
    return (
        <article className="flex flex-col overflow-hidden rounded-2xl border border-border/70 surface-raised">
            <Skeleton className="aspect-[16/10] rounded-none" />
            <div className="flex flex-1 flex-col gap-4 p-4">
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="flex gap-1.5">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-14 rounded-md" />
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3">
                    <Skeleton className="mx-auto h-10 w-12" />
                    <Skeleton className="mx-auto h-10 w-12" />
                    <Skeleton className="mx-auto h-10 w-12" />
                </div>
                <div className="mt-auto flex gap-2">
                    <Skeleton className="h-8 flex-1 rounded-lg" />
                    <Skeleton className="h-8 flex-1 rounded-lg" />
                </div>
            </div>
        </article>
    )
}

export function LobbyCardSkeleton({ showThumb = true }: { showThumb?: boolean }) {
    return (
        <article className="flex flex-col gap-4 rounded-2xl border border-border/70 p-4 surface-raised">
            <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                    {showThumb ? (
                        <Skeleton className="size-11 shrink-0 rounded-lg" />
                    ) : null}
                    <div className="min-w-0 space-y-2">
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                </div>
                <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <div className="space-y-1.5">
                <div className="flex justify-between">
                    <Skeleton className="h-3 w-20" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
            <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/60 pt-3">
                <div className="space-y-1">
                    <Skeleton className="h-3 w-10" />
                    <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
        </article>
    )
}

export function GamesPageSkeleton() {
    return (
        <div className="space-y-8">
            <PageHeaderSkeleton eyebrow action />
            <div className="space-y-6">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <Skeleton className="h-10 max-w-sm flex-1 rounded-lg" />
                    <Skeleton className="h-10 w-64 rounded-lg" />
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <Skeleton className="h-7 w-12 rounded-full" />
                    <Skeleton className="h-7 w-20 rounded-full" />
                    <Skeleton className="h-7 w-16 rounded-full" />
                    <Skeleton className="h-7 w-24 rounded-full" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <GameCardSkeleton key={index} />
                    ))}
                </div>
            </div>
        </div>
    )
}

export function LobbyBrowserSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                <Skeleton className="h-10 w-48 rounded-lg" />
                <Skeleton className="h-10 w-full max-w-sm rounded-lg" />
                <Skeleton className="ml-auto hidden h-10 w-40 rounded-lg lg:block" />
            </div>
            <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
                <aside className="hidden lg:block">
                    <div className="space-y-5 rounded-2xl border border-border/70 p-5 surface-raised">
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-12" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-10" />
                            <div className="flex gap-1.5">
                                <Skeleton className="h-10 flex-1 rounded-lg" />
                                <Skeleton className="h-10 flex-1 rounded-lg" />
                                <Skeleton className="h-10 flex-1 rounded-lg" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-28" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-10" />
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    </div>
                </aside>
                <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <LobbyCardSkeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export function LobbiesPageSkeleton() {
    return (
        <div className="space-y-8">
            <PageHeaderSkeleton eyebrow action />
            <LobbyBrowserSkeleton />
        </div>
    )
}

export function LeaderboardPageSkeleton() {
    return (
        <div className="space-y-8">
            <PageHeaderSkeleton />
            <div className="space-y-6">
                <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-10 w-48 rounded-lg" />
                    <Skeleton className="h-10 w-40 rounded-lg" />
                    <Skeleton className="h-10 w-44 rounded-lg" />
                    <Skeleton className="h-10 w-44 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-64" />
                <div className="grid gap-3 sm:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "flex flex-col items-center gap-3 rounded-2xl border border-border/70 p-5",
                                index === 1 && "sm:py-7"
                            )}
                        >
                            <Skeleton className="size-12 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-32" />
                            <Skeleton className="h-7 w-16" />
                        </div>
                    ))}
                </div>
                <LeaderboardTableSkeleton />
            </div>
        </div>
    )
}

export function LeaderboardTableSkeleton({ rows = 8 }: { rows?: number }) {
    return (
        <div className="overflow-hidden rounded-2xl border border-border/70 surface-raised">
            <div className="hidden grid-cols-[3rem_minmax(0,1fr)_5rem_5rem_6rem_6rem] gap-3 border-b border-border/60 px-4 py-2.5 sm:grid">
                <Skeleton className="h-3 w-4" />
                <Skeleton className="h-3 w-14" />
                <Skeleton className="ml-auto h-3 w-10" />
                <Skeleton className="ml-auto h-3 w-8" />
                <Skeleton className="ml-auto h-3 w-8" />
                <Skeleton className="ml-auto h-3 w-12" />
            </div>
            <div className="divide-y divide-border/50">
                {Array.from({ length: rows }).map((_, index) => (
                    <div
                        key={index}
                        className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 sm:grid-cols-[3rem_minmax(0,1fr)_5rem_5rem_6rem_6rem]"
                    >
                        <Skeleton className="h-5 w-8" />
                        <div className="flex items-center gap-2">
                            <Skeleton className="size-8 shrink-0 rounded-full" />
                            <Skeleton className="h-4 w-28" />
                        </div>
                        <Skeleton className="hidden h-4 w-8 justify-self-end sm:block" />
                        <Skeleton className="hidden h-4 w-10 justify-self-end sm:block" />
                        <Skeleton className="hidden h-4 w-12 justify-self-end sm:block" />
                        <Skeleton className="h-5 w-12 justify-self-end" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export function GameDetailSkeleton() {
    return (
        <div className="space-y-8">
            <section className="overflow-hidden rounded-3xl border border-border/70 surface-raised">
                <div className="grid gap-0 md:grid-cols-[minmax(0,1fr)_380px]">
                    <div className="flex flex-col justify-between gap-6 p-6 sm:p-8">
                        <div className="space-y-4">
                            <Skeleton className="h-8 w-28 rounded-lg" />
                            <div className="space-y-3">
                                <Skeleton className="h-9 w-48 sm:h-10 sm:w-64" />
                                <Skeleton className="h-4 w-full max-w-xl" />
                                <Skeleton className="h-4 w-3/4 max-w-md" />
                                <div className="flex gap-1.5">
                                    <Skeleton className="h-6 w-16 rounded-md" />
                                    <Skeleton className="h-6 w-20 rounded-md" />
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Skeleton className="h-12 w-36 rounded-lg" />
                            <Skeleton className="h-12 w-36 rounded-lg" />
                        </div>
                    </div>
                    <Skeleton className="hidden aspect-square rounded-none md:block" />
                </div>
            </section>

            <section className="grid gap-4 rounded-2xl border border-border/70 p-5 surface-raised sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <Skeleton className="size-9 shrink-0 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-7 w-12" />
                        </div>
                    </div>
                ))}
            </section>

            <section className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                    <div className="space-y-1">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-9 w-40 rounded-lg" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <LobbyCardSkeleton key={index} showThumb={false} />
                    ))}
                </div>
            </section>
        </div>
    )
}

export function ProfilePageSkeleton() {
    return (
        <div className="space-y-8">
            <header className="overflow-hidden rounded-2xl border border-border/70 surface-raised">
                <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-6 p-5 sm:p-6">
                    <div className="flex min-w-0 items-center gap-4">
                        <Skeleton className="size-16 shrink-0 rounded-full sm:size-20" />
                        <div className="space-y-2">
                            <Skeleton className="h-9 w-40 sm:h-10 sm:w-52" />
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-3 w-36" />
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-x-8 gap-y-4">
                        {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="space-y-1">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-7 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 gap-5 rounded-2xl border border-border/70 p-5 surface-raised lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="flex items-start gap-3">
                        <Skeleton className="size-9 shrink-0 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="h-3 w-14" />
                            <Skeleton className="h-7 w-12" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                <section className="min-w-0 space-y-4">
                    <Skeleton className="h-7 w-36" />
                    <div className="overflow-hidden rounded-2xl border border-border/70 surface-raised">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0"
                            >
                                <Skeleton className="size-9 shrink-0 rounded-lg" />
                                <div className="min-w-0 flex-1 space-y-1.5">
                                    <Skeleton className="h-3.5 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-4 w-12 shrink-0" />
                                <Skeleton className="h-3 w-16 shrink-0" />
                            </div>
                        ))}
                    </div>
                </section>
                <div className="space-y-8">
                    <section className="space-y-4">
                        <Skeleton className="h-7 w-36" />
                        <div className="overflow-hidden rounded-2xl border border-border/70 surface-raised">
                            {Array.from({ length: 3 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 border-b border-border/60 px-3 py-2.5 last:border-b-0"
                                >
                                    <Skeleton className="size-10 shrink-0 rounded-lg" />
                                    <div className="min-w-0 flex-1 space-y-1.5">
                                        <Skeleton className="h-3.5 w-24" />
                                        <Skeleton className="h-3 w-16" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                    <section className="space-y-4">
                        <Skeleton className="h-7 w-32" />
                        <div className="space-y-2 rounded-2xl border border-border/70 p-4 surface-raised">
                            <Skeleton className="h-5 w-28" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

export function WalletPageSkeleton({ header = true }: { header?: boolean }) {
    return (
        <div className="space-y-8">
            {header ? <PageHeaderSkeleton /> : null}
            <div className="space-y-10">
                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="space-y-4">
                        <Skeleton className="h-7 w-24" />
                        <div className="space-y-4 rounded-2xl border border-border/70 p-5 surface-raised">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-12 w-40" />
                            <Skeleton className="h-4 w-48" />
                        </div>
                    </section>
                    <section className="space-y-4">
                        <Skeleton className="h-7 w-24" />
                        <div className="space-y-4 rounded-2xl border border-border/70 p-5 surface-raised">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-5/6" />
                            <Skeleton className="h-16 w-full rounded-xl" />
                            <Skeleton className="h-10 w-32 rounded-lg" />
                        </div>
                    </section>
                </div>
                <section className="space-y-4">
                    <div className="space-y-1">
                        <Skeleton className="h-7 w-24" />
                        <Skeleton className="h-4 w-72 max-w-full" />
                    </div>
                    <div className="space-y-4 lg:max-w-xl">
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-full rounded-lg" />
                        <Skeleton className="h-10 w-36 rounded-lg" />
                    </div>
                </section>
                <section className="space-y-4">
                    <Skeleton className="h-7 w-32" />
                    <div className="space-y-2 rounded-2xl border border-border/70 p-4 surface-raised">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </section>
                <section className="space-y-4">
                    <Skeleton className="h-7 w-32" />
                    <div className="flex flex-wrap gap-1.5">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <Skeleton
                                key={index}
                                className="h-8 w-20 rounded-lg"
                            />
                        ))}
                    </div>
                    <div className="space-y-0 overflow-hidden rounded-2xl border border-border/70 surface-raised">
                        {Array.from({ length: 5 }).map((_, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3 last:border-b-0"
                            >
                                <div className="space-y-1.5">
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-3 w-32" />
                                </div>
                                <Skeleton className="h-4 w-16" />
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    )
}

export function SettingsPageSkeleton({ header = true }: { header?: boolean }) {
    return (
        <div className="space-y-8">
            {header ? <PageHeaderSkeleton eyebrow /> : null}
            <div className="space-y-10">
                {Array.from({ length: 4 }).map((_, index) => (
                    <section key={index} className="space-y-4">
                        <div className="space-y-1">
                            <Skeleton className="h-7 w-28" />
                            <Skeleton className="h-4 w-72 max-w-full" />
                        </div>
                        <div className="space-y-4 rounded-2xl border border-border/70 p-5 surface-raised">
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                            <div className="space-y-2">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-10 w-full rounded-lg" />
                            </div>
                            {index === 0 ? (
                                <Skeleton className="h-10 w-28 rounded-lg" />
                            ) : null}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    )
}
