import Image from "next/image"

import { SectionHeader } from "@/components/common/section"

const PARTNERS = [
    {
        name: "BOT Chain",
        href: "https://botchain.ai/",
        logo: "/partners/bot-chain-logo.png",
        width: 409,
        height: 80,
    },
    {
        name: "Stacks",
        href: "https://www.stacks.co/",
        logo: "/partners/stacks-logo.webp",
        width: 860,
        height: 160,
    },
]

export function EcosystemPartners() {
    return (
        <section className="space-y-5">
            <SectionHeader title="Ecosystem partners" />
            <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
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
                            className="h-8 w-auto object-contain"
                        />
                        <span className="sr-only">(opens in a new tab)</span>
                    </a>
                ))}
            </div>
        </section>
    )
}
