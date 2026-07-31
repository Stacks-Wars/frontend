import { cn } from "@/lib/utils"

export function SectionHeader({
    title,
    description,
    action,
    className,
}: {
    title: React.ReactNode
    description?: React.ReactNode
    action?: React.ReactNode
    className?: string
}) {
    return (
        <div
            className={cn(
                "flex flex-wrap items-end justify-between gap-3",
                className
            )}
        >
            <div className="space-y-1">
                <h2 className="font-display text-xl sm:text-2xl">{title}</h2>
                {description ? (
                    <p className="text-sm text-muted-foreground">{description}</p>
                ) : null}
            </div>
            {action}
        </div>
    )
}

export function PageHeader({
    eyebrow,
    title,
    description,
    action,
    className,
}: {
    eyebrow?: React.ReactNode
    title: React.ReactNode
    description?: React.ReactNode
    action?: React.ReactNode
    className?: string
}) {
    return (
        <header
            className={cn(
                "flex flex-wrap items-end justify-between gap-4",
                className
            )}
        >
            <div className="space-y-2">
                {eyebrow ? (
                    <p className="text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
                        {eyebrow}
                    </p>
                ) : null}
                <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
                {description ? (
                    <p className="max-w-2xl text-sm text-muted-foreground">
                        {description}
                    </p>
                ) : null}
            </div>
            {action}
        </header>
    )
}
