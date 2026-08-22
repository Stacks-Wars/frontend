import { RiArrowLeftLine } from "@remixicon/react"

import { Brand } from "@/components/shell/brand"
import { ButtonLink } from "@/components/ui"

const POINTS = [
    "Entry fees sit in an on-chain vault, not with us.",
    "Leave before the start and the refund is automatic.",
    "Season points update the moment a match settles.",
]

export default function AuthLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="flex flex-col">
                <div className="flex items-center justify-between px-4 py-6 sm:px-8">
                    <Brand />
                    <ButtonLink
                        href="/"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                    >
                        <RiArrowLeftLine />
                        Home
                    </ButtonLink>
                </div>
                <div className="flex flex-1 items-center justify-center px-4 pb-16 sm:px-8">
                    <div className="w-full max-w-sm">{children}</div>
                </div>
            </div>

            <aside className="relative hidden overflow-hidden border-l border-border/60 bg-grid lg:block">
                <div className="absolute inset-0 bg-linear-to-br from-primary/15 via-transparent to-gold/10" />
                <div className="relative flex h-full flex-col justify-end gap-8 p-12">
                    <p className="font-display text-4xl leading-tight">
                        Skill games,
                        <br />
                        settled on-chain.
                    </p>
                    <ul className="space-y-3 border-t border-border/50 pt-6">
                        {POINTS.map((point) => (
                            <li
                                key={point}
                                className="flex gap-3 text-sm text-muted-foreground"
                            >
                                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                                {point}
                            </li>
                        ))}
                    </ul>
                </div>
            </aside>
        </div>
    )
}
