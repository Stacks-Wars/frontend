import { DefaultGamePage } from "@/components/games/default-game-page"

type Props = {
    params: Promise<{ gameId: string }>
}

/**
 * Fallback for any registered game without a dedicated `/game/{id}` page.
 * Prefer adding a sibling folder (e.g. `game/checkers/page.tsx`) for custom UIs.
 */
export default async function GameCatchAllPage({ params }: Props) {
    const { gameId } = await params
    return <DefaultGamePage gameId={gameId} />
}
