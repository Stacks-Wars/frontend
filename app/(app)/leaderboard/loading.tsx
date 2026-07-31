import { TablePageSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"

export default function LeaderboardLoading() {
    return (
        <PageContainer>
            <TablePageSkeleton rows={10} />
        </PageContainer>
    )
}
