import { PageHeaderSkeleton } from "@/components/common/list-skeleton"
import { PageContainer } from "@/components/common/page-container"
import { QuestsSkeleton } from "@/components/quests/quests-skeleton"

export default function QuestsLoading() {
    return (
        <PageContainer className="space-y-8">
            <PageHeaderSkeleton />
            <QuestsSkeleton />
        </PageContainer>
    )
}
