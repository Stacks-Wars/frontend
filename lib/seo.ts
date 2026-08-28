import type { GameMetadata } from "@/lib/api/types"
import { LEGAL_SITE, LEGAL_TELEGRAM } from "@/lib/legal"

export const SITE_NAME = "Stacks Wars"

/** Default meta description. Used as the root fallback and OG/Twitter copy. */
export const SITE_DESCRIPTION =
    "Onchain gaming for competitive multiplayer. Lobbies, seasons, and prize pots on Stacks Wars."

export const HOME_TITLE = "Stacks Wars | Onchain gaming"

export const HOME_DESCRIPTION =
    "Play competitive multiplayer games onchain. Join a lobby, stake, compete, and settle the pot on Stacks Wars."

export const DOCS_URL = "https://docs.stackswars.com"

export function siteOrigin(): string {
    return (
        process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || LEGAL_SITE
    )
}

export function organizationJsonLd() {
    const origin = siteOrigin()
    return {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Organization",
                "@id": `${origin}/#org`,
                name: SITE_NAME,
                url: origin,
                logo: `${origin}/logo.png`,
                sameAs: [LEGAL_TELEGRAM, DOCS_URL],
            },
            {
                "@type": "WebSite",
                "@id": `${origin}/#website`,
                name: SITE_NAME,
                url: origin,
                description: SITE_DESCRIPTION,
                publisher: { "@id": `${origin}/#org` },
            },
        ],
    }
}

export function gamesItemListJsonLd(games: GameMetadata[]) {
    const origin = siteOrigin()
    return {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Onchain games on Stacks Wars",
        itemListElement: games.map((game, index) => ({
            "@type": "ListItem",
            position: index + 1,
            url: `${origin}/games/${game.id}`,
            name: game.name,
        })),
    }
}

export function videoGameJsonLd(game: GameMetadata) {
    const origin = siteOrigin()
    return {
        "@context": "https://schema.org",
        "@type": "VideoGame",
        name: game.name,
        description: game.description,
        url: `${origin}/games/${game.id}`,
        image: `${origin}/games/${game.id}.png`,
        playMode: "MultiPlayer",
        publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            url: origin,
        },
    }
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
    const origin = siteOrigin()
    return {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            item: `${origin}${item.path}`,
        })),
    }
}

export function gameMetaDescription(game: GameMetadata): string {
    const base = game.description.trim()
    if (/onchain|on-chain|Stacks Wars/i.test(base)) return base
    return `${base} Play onchain on Stacks Wars.`
}
