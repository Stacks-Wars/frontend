import { SettingsPageSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"

export default function SettingsLoading() {
    return (
        <PageContainer size="default">
            <SettingsPageSkeleton />
        </PageContainer>
    )
}
