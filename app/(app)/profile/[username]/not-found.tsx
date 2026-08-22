import { RiUserSearchLine } from "@remixicon/react"

import { PageContainer } from "@/components/common/page-container"
import { ButtonLink, EmptyState } from "@/components/ui"

export default function ProfileNotFound() {
    return (
        <PageContainer size="narrow">
            <EmptyState
                icon={<RiUserSearchLine />}
                title="No such player"
                description="This username does not exist, or the player has not claimed a handle yet."
                action={
                    <ButtonLink href="/lobbies" variant="outline" size="sm">
                        Browse lobbies
                    </ButtonLink>
                }
            />
        </PageContainer>
    )
}
