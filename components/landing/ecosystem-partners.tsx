import Image from "next/image"

import { SectionHeader } from "@/components/common/section"
import { cn } from "@/lib/utils"

// BOT Chain is a lockup (mark + wordmark), so its wordmark only fills ~64% of
// its canvas while the Stacks wordmark fills all of its own. Matching box
// heights would render the Stacks type about half again as tall, so each logo
// is sized to match the other's wordmark instead.
const PARTNERS = [
    {
        name: "BOT Chain",
        href: "https://botchain.ai/",
        logo: "/partners/bot-chain-logo.png",
        width: 409,
        height: 80,
        size: "h-7 sm:h-8",
    },
    {
        name: "Stacks",
        href: "https://www.stacks.co/",
        logo: "/partners/stacks-logo.webp",
        width: 860,
        height: 160,
        size: "h-4.5 sm:h-5",
    },
]

export function EcosystemPartners() {
    return (
        <section className="space-y-5">
            <SectionHeader title="Ecosystem partners" />
            <div className="flex flex-wrap items-center gap-x-8 gap-y-5 sm:gap-x-12">
                {PARTNERS.map((partner, index) => (
                    <a
                        key={partner.name}
                        href={partner.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="animate-rise-in rounded-lg opacity-80 transition outline-none stagger hover:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50"
                        style={{ "--index": index } as React.CSSProperties}
                    >
                        <Image
                            src={partner.logo}
                            alt={partner.name}
                            width={partner.width}
                            height={partner.height}
                            className={cn(
                                "w-auto object-contain",
                                partner.size
                            )}
                        />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                ))}
            </div>
        </section>
    )
}
