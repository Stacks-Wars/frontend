import type { MetadataRoute } from "next"

import { APP_BACKGROUND } from "@/lib/theme"

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "Stacks Wars",
        short_name: "Stacks Wars",
        description:
            "Competitive Stacks arena — lobbies, seasons, and skill-based games.",
        start_url: "/",
        display: "standalone",
        background_color: APP_BACKGROUND,
        theme_color: APP_BACKGROUND,
        icons: [
            {
                src: "/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                src: "/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    }
}
