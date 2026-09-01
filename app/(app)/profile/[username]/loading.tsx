import { ProfilePageSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"

export default function ProfileLoading() {
    return (
        <PageContainer size="wide">
            <ProfilePageSkeleton />
        </PageContainer>
    )
}
