import type { Metadata, Viewport } from "next"
import localFont from "next/font/local"

import { Provider } from "@/app/provider"
import { APP_BACKGROUND } from "@/lib/theme"

import "./globals.css"

const neueMontreal = localFont({
    src: [
        {
            path: "./fonts/NeueMontreal-Light.woff2",
            weight: "300",
            style: "normal",
        },
        {
            path: "./fonts/NeueMontreal-Regular.woff2",
            weight: "400",
            style: "normal",
        },
        {
            path: "./fonts/NeueMontreal-Medium.woff2",
            weight: "500",
            style: "normal",
        },
        {
            path: "./fonts/NeueMontreal-Bold.woff2",
            weight: "700",
            style: "normal",
        },
    ],
    variable: "--font-neue",
    display: "swap",
})

const appOrigin =
    process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
    "https://stackswars.com"

export const metadata: Metadata = {
    metadataBase: new URL(appOrigin),
    title: {
        default: "Stacks Wars",
        template: "%s · Stacks Wars",
    },
    description:
        "Competitive Stacks arena — lobbies, seasons, and skill-based games.",
    applicationName: "Stacks Wars",
    icons: {
        icon: [
            { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
            { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
            {
                url: "/android-chrome-192x192.png",
                sizes: "192x192",
                type: "image/png",
            },
            {
                url: "/android-chrome-512x512.png",
                sizes: "512x512",
                type: "image/png",
            },
        ],
    },
    appleWebApp: {
        capable: true,
        title: "Stacks Wars",
        statusBarStyle: "black",
    },
    openGraph: {
        type: "website",
        siteName: "Stacks Wars",
        title: "Stacks Wars",
        description:
            "Competitive Stacks arena — lobbies, seasons, and skill-based games.",
    },
    twitter: {
        card: "summary_large_image",
        title: "Stacks Wars",
        description:
            "Competitive Stacks arena — lobbies, seasons, and skill-based games.",
    },
}

export const viewport: Viewport = {
    themeColor: APP_BACKGROUND,
    colorScheme: "dark",
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en" className={`${neueMontreal.variable} dark`}>
            <body>
                <Provider>{children}</Provider>
            </body>
        </html>
    )
}
