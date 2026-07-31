import { PageContainer } from "@/components/common/page-container"
import { RoomSkeleton } from "@/components/room/room-skeleton"

export default function RoomLoading() {
    return (
        <PageContainer size="wide">
            <RoomSkeleton />
        </PageContainer>
    )
}
