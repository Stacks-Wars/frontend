import { GameDetailSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"

export default function GameLoading() {
    return (
        <PageContainer size="wide">
            <GameDetailSkeleton />
        </PageContainer>
    )
}
