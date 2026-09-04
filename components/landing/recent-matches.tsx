import { SectionHeader } from "@/components/common/section"
import { FinishedLobbies } from "@/components/games/finished-lobbies"
import type { Lobby } from "@/lib/api/types"

export function LandingRecentMatches({ initial }: { initial: Lobby[] }) {
    return (
        <section className="space-y-4">
            <SectionHeader
                title="Recent matches"
                description="Finished lobbies across every game."
            />
            <FinishedLobbies initial={initial} limit={10} />
        </section>
    )
}
