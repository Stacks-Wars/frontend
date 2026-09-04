import type { Metadata } from "next"

import type { GameMetadata } from "@/lib/api/types"
import { LEGAL_SITE, LEGAL_TELEGRAM } from "@/lib/legal"

export const SITE_NAME = "Stacks Wars"

/** Default meta description. Used as the root fallback and OG/Twitter copy. */
export const SITE_DESCRIPTION =
    "Onchain gaming for competitive multiplayer. Lobbies, seasons, and prize pots on Stacks Wars."

export const HOME_TITLE = "Stacks Wars | Onchain gaming"

export const HOME_DESCRIPTION =
    "Play competitive multiplayer games onchain. Join a lobby, stake, compete, and settle the pot on Stacks Wars."

/** Search metadata only — not shown in titles or descriptions. */
export const SITE_KEYWORDS = [
    "Stacks Wars",
    "gaming on solana",
    "gaming on stacks",
    "onchain gaming",
    "blockchain gaming",
    "web3 games",
    "real-time multiplayer",
    "competitive gaming",
    "skill-based games",
    "on-chain rewards",
    "Stacks blockchain",
    "Solana blockchain",
    "play to compete",
    "crypto gaming",
]

export const DOCS_URL = "https://docs.stackswars.com"

/**
 * Public origin used for canonicals, sitemap, JSON-LD, and OG image URLs.
 *
 * Production apex (`stackswars.com`) 307s to `www`. Facebook, Telegram, Slack,
 * and X often refuse to follow that redirect on `og:image`, so metadata must
 * point at the host that actually 200s.
 */
export function siteOrigin(): string {
    const raw =
        process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || LEGAL_SITE
    try {
        const url = new URL(raw)
        if (url.hostname === "stackswars.com") {
            url.hostname = "www.stackswars.com"
            return url.origin
        }
    } catch {
        /* invalid env — use as-is */
    }
    return raw
}

/** Default OG/Twitter image. Relative so `metadataBase` resolves it. */
export const OG_IMAGE_PATH = "/opengraph-image"

export function siteOgImages(alt = SITE_NAME) {
    return [
        {
            url: OG_IMAGE_PATH,
            width: 1200,
            height: 630,
            alt,
            type: "image/png",
        },
    ] satisfies NonNullable<Metadata["openGraph"]>["images"]
}

export function siteTwitterImages() {
    return [OG_IMAGE_PATH]
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
                keywords: SITE_KEYWORDS.join(", "),
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
        image: `${origin}${OG_IMAGE_PATH}`,
        playMode: "MultiPlayer",
        gamePlatform: ["Solana", "Stacks"],
        keywords: SITE_KEYWORDS.join(", "),
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
