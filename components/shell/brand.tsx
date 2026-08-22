"use client"

import Image from "next/image"

import { ButtonLink } from "@/components/ui"
import { cn } from "@/lib/utils"

export function Brand({ className }: { className?: string }) {
    return (
        <ButtonLink
            href="/"
            variant="ghost"
            className={cn(
                "h-auto gap-2.5 rounded-lg px-1.5 py-1 hover:bg-transparent",
                className
            )}
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
        </ButtonLink>
    )
}
