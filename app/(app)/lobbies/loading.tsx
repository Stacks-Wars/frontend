import { LobbiesPageSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"

export default function LobbiesLoading() {
    return (
        <PageContainer size="wide">
            <LobbiesPageSkeleton />
        </PageContainer>
    )
}
