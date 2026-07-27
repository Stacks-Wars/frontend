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
