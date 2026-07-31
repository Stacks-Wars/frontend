import { PageContainer } from "@/components/common/page-container"
import { Skeleton } from "@/components/ui"

export default function GameLoading() {
    return (
        <PageContainer size="wide" className="space-y-8">
            <Skeleton className="h-64 rounded-3xl" />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <Skeleton key={index} className="h-24 rounded-2xl" />
                ))}
            </div>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 3 }).map((_, index) => (
                    <Skeleton key={index} className="h-52 rounded-2xl" />
                ))}
            </div>
        </PageContainer>
    )
}
