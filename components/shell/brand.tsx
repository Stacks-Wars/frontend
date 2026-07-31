import Image from "next/image"
import Link from "next/link"

import { cn } from "@/lib/utils"

export function Brand({ className }: { className?: string }) {
    return (
        <Link
            href="/"
            className={cn("group flex items-center gap-2.5", className)}
        >
            <Image
                src="/logo.png"
                alt="Stacks Wars"
                width={32}
                height={32}
                className="size-8 rounded-lg object-contain"
                priority
            />
            <span className="hidden font-display text-[15px] tracking-tight sm:block">
                Stacks Wars
            </span>
        </Link>
    )
}
