import type { Metadata } from "next"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader } from "@/components/common/section"
import { QuestsView } from "@/components/quests/quests-view"
import { getMyQuests } from "@/lib/api/server"

export const metadata: Metadata = {
    title: "Quests",
    description:
        "A season-long progression. Play, claim Wars Points, and come back tomorrow.",
    alternates: { canonical: "/quests" },
}

export default async function QuestsPage() {
    const initial = await getMyQuests().catch(() => null)

    return (
        <PageContainer className="space-y-8">
            <PageHeader
                title="Quests"
                description="Your season. Play with purpose, claim the points, come back stronger."
            />
            <QuestsView initial={initial} />
        </PageContainer>
    )
}
