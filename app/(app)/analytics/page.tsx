import { PageContainer } from "@/components/common/page-container"
import { AnalyticsView } from "@/components/analytics/analytics-view"
import { listGames, listSeasons } from "@/lib/api/server"
import type { Season } from "@/lib/api/types"

export default async function AnalyticsPage() {
    const [games, seasons] = await Promise.all([
        listGames().catch(() => []),
        listSeasons().catch(() => [] as Season[]),
    ])

    return (
        <PageContainer size="wide" className="space-y-8">
            <AnalyticsView seasons={seasons} games={games} />
        </PageContainer>
    )
}
