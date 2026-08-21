import type { ReactNode } from "react"

import { PageContainer } from "@/components/common/page-container"
import {
    LEGAL_CONTACT_EMAIL,
    LEGAL_SITE,
    LEGAL_TELEGRAM,
    LEGAL_VERSION,
} from "@/lib/legal"

export function LegalDoc({
    title,
    updated,
    children,
}: {
    title: string
    updated: string
    children: ReactNode
}) {
    return (
        <PageContainer size="narrow" className="space-y-8">
            <header className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                    Legal
                </p>
                <h1 className="font-display text-3xl tracking-tight sm:text-4xl">
                    {title}
                </h1>
                <p className="text-sm text-muted-foreground">
                    Last updated {updated}. Draft for Stacks Wars ({LEGAL_SITE}
                    ). Not legal advice — have counsel review before treating
                    this as regional coverage.
                </p>
            </header>
            <div className="space-y-8 text-sm leading-relaxed text-muted-foreground [&_h2]:font-display [&_h2]:text-xl [&_h2]:text-foreground [&_h2]:tracking-tight [&_a]:font-medium [&_a]:text-foreground [&_a]:underline-offset-2 hover:[&_a]:underline [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5">
                {children}
            </div>
            <p className="text-xs text-muted-foreground">
                Questions:{" "}
                <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
                    {LEGAL_CONTACT_EMAIL}
                </a>{" "}
                · Telegram{" "}
                <a href={LEGAL_TELEGRAM} target="_blank" rel="noreferrer">
                    t.me/stackswars
                </a>
                . Version {LEGAL_VERSION}.
            </p>
        </PageContainer>
    )
}
