import { WalletPageSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"

export default function WalletLoading() {
    return (
        <PageContainer size="default">
            <WalletPageSkeleton />
        </PageContainer>
    )
}
