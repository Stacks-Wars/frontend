"use client"

import Image from "next/image"

import { ButtonLink } from "@/components/ui"
import { cn } from "@/lib/utils"

export function Brand({
    className,
    hideName = false,
}: {
    className?: string
    hideName?: boolean
}) {
    return (
        <ButtonLink
            href="/"
            variant="ghost"
            className={cn(
                "h-auto gap-2.5 rounded-none px-1.5 py-1 hover:bg-transparent",
                className
            )}
        >
            <Image
                src="/logo.png"
                alt="Stacks Wars"
                width={32}
                height={32}
                className="size-8 object-contain"
                priority
            />
            <span
                className={cn(
                    "font-brand text-[15px] font-semibold tracking-[0.06em] uppercase",
                    hideName && "hidden sm:block"
                )}
            >
                Stacks Wars
            </span>
        </ButtonLink>
    )
}
