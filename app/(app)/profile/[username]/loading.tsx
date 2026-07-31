import { PageContainer } from "@/components/common/page-container"
import { Skeleton } from "@/components/ui"

export default function ProfileLoading() {
    return (
        <PageContainer size="wide" className="space-y-8">
            <Skeleton className="h-40 rounded-2xl" />
            <Skeleton className="h-24 rounded-2xl" />
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
                <div className="space-y-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="h-14 rounded-xl" />
                    ))}
                </div>
                <div className="space-y-4">
                    <Skeleton className="h-44 rounded-2xl" />
                    <Skeleton className="h-56 rounded-2xl" />
                </div>
            </div>
        </PageContainer>
    )
}
