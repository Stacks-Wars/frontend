import type { Metadata } from "next"
import localFont from "next/font/local"

import { Provider } from "@/app/provider"

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

export const metadata: Metadata = {
    title: {
        default: "Stacks Wars",
        template: "%s · Stacks Wars",
    },
    description:
        "Competitive Stacks arena — lobbies, seasons, and skill-based games.",
    applicationName: "Stacks Wars",
    manifest: "/site.webmanifest",
    icons: {
        icon: [
            { url: "/favicon.ico" },
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
        apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    appleWebApp: {
        title: "Stacks Wars",
        statusBarStyle: "black-translucent",
    },
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
