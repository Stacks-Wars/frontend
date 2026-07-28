import Image from "next/image"
import Link from "next/link"

import { CreateLobbyButton } from "@/components/games/create-lobby-button"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type GameCardProps = {
    name: string
    slug: string
    blurb: string
    image: string
    accent?: string
}

export function GameCard({
    name,
    slug,
    blurb,
    image,
    accent = "from-primary/40",
}: GameCardProps) {
    return (
        <article className="group relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-card">
            <div
                className={cn(
                    "absolute inset-0 bg-linear-to-br to-transparent opacity-80 transition-opacity group-hover:opacity-100",
                    accent
                )}
            />
            <div className="relative flex min-h-64 flex-col justify-between p-5">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h3 className="font-display text-2xl tracking-tight">
                            {name}
                        </h3>
                        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
                            {blurb}
                        </p>
                    </div>
                    <div className="relative size-20 overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                        <Image
                            src={image}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                    </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                    <CreateLobbyButton game={{ id: slug, name }} />
                    <Link
                        href={`/game/${slug}`}
                        className={cn(buttonVariants({ variant: "outline" }))}
                    >
                        See Game
                    </Link>
                </div>
            </div>
        </article>
    )
}
