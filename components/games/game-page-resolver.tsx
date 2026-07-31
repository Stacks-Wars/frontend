"use client"

import "@/games/boot"

import { useDefaultGameSections } from "@/components/games/default-game-page"
import { getGameModule } from "@/games/registry"
import type { GamePageProps } from "@/games/types"

/**
 * Chooses between the default game page and a game's own registered page.
 *
 * A registered `Page` receives the default sections, so it can wrap, reorder,
 * or replace individual pieces instead of starting from nothing.
 */
export function GamePageResolver(props: Omit<GamePageProps, "sections">) {
    const sections = useDefaultGameSections(props)
    const registered = getGameModule(props.game.id)

    if (registered?.Page) {
        return registered.Page({ ...props, sections })
    }
    return sections.Default()
}
