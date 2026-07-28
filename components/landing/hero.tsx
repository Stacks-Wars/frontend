import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function Hero() {
    return (
        <section className="relative overflow-hidden">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(44,97,184,0.35),transparent_40%),radial-gradient(circle_at_80%_10%,rgba(242,156,17,0.18),transparent_35%)]" />
            <div className="relative mx-auto flex min-h-[calc(100svh-4rem)] w-full max-w-6xl flex-col justify-center px-4 py-16 sm:px-6">
                <p className="font-display text-5xl leading-[0.95] tracking-tight text-foreground sm:text-7xl md:text-8xl">
                    Stacks Wars
                </p>
                <h1 className="mt-5 max-w-2xl text-2xl font-medium text-foreground/90 sm:text-3xl">
                    Rise of the Arena
                </h1>
                <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
                    Competitive lobbies, seasons, and on-chain stakes — built
                    for speed, not clutter.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                    <Link
                        href="/games"
                        className={cn(buttonVariants({ size: "lg" }))}
                    >
                        Play Now
                    </Link>
                    <Link
                        href="/lobby"
                        className={cn(
                            buttonVariants({ size: "lg", variant: "outline" })
                        )}
                    >
                        Browse Lobbies
                    </Link>
                </div>
            </div>
        </section>
    )
}
