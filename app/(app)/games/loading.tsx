import { GamesPageSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"

export default function GamesLoading() {
    return (
        <PageContainer size="wide">
            <GamesPageSkeleton />
        </PageContainer>
    )
}
