import type { MetadataRoute } from "next"

import { listGames } from "@/lib/api/server"
import { siteOrigin } from "@/lib/seo"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const origin = siteOrigin()
    const now = new Date()
    const games = await listGames().catch(() => [])

    const staticRoutes: MetadataRoute.Sitemap = [
        {
            url: origin,
            lastModified: now,
            changeFrequency: "hourly",
            priority: 1,
        },
        {
            url: `${origin}/games`,
            lastModified: now,
            changeFrequency: "hourly",
            priority: 0.9,
        },
        {
            url: `${origin}/lobbies`,
            lastModified: now,
            changeFrequency: "always",
            priority: 0.8,
        },
        {
            url: `${origin}/leaderboard`,
            lastModified: now,
            changeFrequency: "hourly",
            priority: 0.7,
        },
        {
            url: `${origin}/terms`,
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.3,
        },
        {
            url: `${origin}/privacy`,
            lastModified: now,
            changeFrequency: "yearly",
            priority: 0.3,
        },
    ]

    const gameRoutes: MetadataRoute.Sitemap = games.map((game) => ({
        url: `${origin}/games/${game.id}`,
        lastModified: now,
        changeFrequency: "hourly",
        priority: 0.8,
    }))

    return [...staticRoutes, ...gameRoutes]
}
