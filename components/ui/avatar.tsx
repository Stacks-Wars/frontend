"use client"

import { Avatar as AvatarPrimitive } from "@base-ui/react/avatar"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const avatarVariants = cva(
    "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted align-middle leading-none font-medium select-none",
    {
        variants: {
            size: {
                xs: "size-6 text-[10px]",
                sm: "size-8 text-xs",
                default: "size-10 text-sm",
                lg: "size-12 text-base",
                xl: "size-16 text-lg",
            },
        },
        defaultVariants: {
            size: "default",
        },
    }
)

/**
 * Ring tones are indexed by a hash of the `seed`, so the same player always
 * gets the same accent across renders and across server/client boundaries.
 */
const ringTones = [
    "ring-primary/60 text-primary",
    "ring-gold/60 text-gold",
    "ring-success/60 text-success",
    "ring-live/60 text-live",
    "ring-warning/60 text-warning",
]

function hashSeed(seed: string) {
    let hash = 0
    for (let index = 0; index < seed.length; index += 1) {
        hash = (hash << 5) - hash + seed.charCodeAt(index)
        hash |= 0
    }
    return Math.abs(hash)
}

function toneForSeed(seed: string) {
    return ringTones[hashSeed(seed) % ringTones.length]
}

function initialsFromSeed(seed: string) {
    const words = seed
        .trim()
        .split(/[\s_.-]+/)
        .filter(Boolean)
    if (words.length === 0) {
        return "?"
    }
    if (words.length === 1) {
        return words[0].slice(0, 2).toUpperCase()
    }
    return `${words[0][0]}${words[words.length - 1][0]}`.toUpperCase()
}

function Avatar({
    className,
    size = "default",
    ...props
}: Omit<AvatarPrimitive.Root.Props, "className"> &
    VariantProps<typeof avatarVariants> & { className?: string }) {
    return (
        <AvatarPrimitive.Root
            data-slot="avatar"
            className={cn(avatarVariants({ size, className }))}
            {...props}
        />
    )
}

function AvatarImage({
    className,
    ...props
}: Omit<AvatarPrimitive.Image.Props, "className"> & { className?: string }) {
    return (
        <AvatarPrimitive.Image
            data-slot="avatar-image"
            className={cn("size-full object-cover", className)}
            {...props}
        />
    )
}

function AvatarFallback({
    className,
    seed,
    children,
    ...props
}: Omit<AvatarPrimitive.Fallback.Props, "className"> & {
    className?: string
    seed?: string
}) {
    return (
        <AvatarPrimitive.Fallback
            data-slot="avatar-fallback"
            className={cn(
                "flex size-full items-center justify-center rounded-full bg-muted uppercase",
                seed ? `ring-2 ring-inset ${toneForSeed(seed)}` : null,
                className
            )}
            {...props}
        >
            {children ?? (seed ? initialsFromSeed(seed) : null)}
        </AvatarPrimitive.Fallback>
    )
}

export { Avatar, AvatarImage, AvatarFallback, avatarVariants }
