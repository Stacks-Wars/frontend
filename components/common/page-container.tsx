import { cn } from "@/lib/utils"

export function PageContainer({
    children,
    className,
    size = "default",
}: {
    children: React.ReactNode
    className?: string
    size?: "default" | "wide" | "narrow"
}) {
    return (
        <div
            className={cn(
                "mx-auto w-full px-4 py-8 sm:px-6 lg:px-8",
                size === "wide" && "max-w-350",
                size === "default" && "max-w-300",
                size === "narrow" && "max-w-3xl",
                className
            )}
        >
            {children}
        </div>
    )
}
