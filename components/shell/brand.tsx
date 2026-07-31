import Link from "next/link"

import { cn } from "@/lib/utils"

export function Brand({ className }: { className?: string }) {
    return (
        <Link
            href="/"
            className={cn("group flex items-center gap-2.5", className)}
        >
            <span className="relative grid size-8 place-items-center overflow-hidden rounded-lg bg-primary/15 ring-1 ring-primary/40 ring-inset">
                <span className="absolute inset-x-0 -top-4 h-8 rounded-full bg-primary/40 blur-md transition-transform group-hover:translate-y-1" />
                <span className="relative font-display text-[13px] leading-none text-primary">
                    SW
                </span>
            </span>
            <span className="hidden font-display text-[15px] tracking-tight sm:block">
                Stacks Wars
            </span>
        </Link>
    )
}
