import { LeaderboardPageSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"

export default function LeaderboardLoading() {
    return (
        <PageContainer>
            <LeaderboardPageSkeleton />
        </PageContainer>
    )
}
