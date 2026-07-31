import Link from "next/link"
import { RiUserSearchLine } from "@remixicon/react"

import { PageContainer } from "@/components/common/page-container"
import { Button, EmptyState } from "@/components/ui"

export default function ProfileNotFound() {
    return (
        <PageContainer size="narrow">
            <EmptyState
                icon={<RiUserSearchLine />}
                title="No such player"
                description="This username does not exist, or the player has not claimed a handle yet."
                action={
                    <Button
                        variant="outline"
                        size="sm"
                        render={<Link href="/lobbies" />}
                    >
                        Browse lobbies
                    </Button>
                }
            />
        </PageContainer>
    )
}
