import type { Metadata, Viewport } from "next"
import { Oxanium } from "next/font/google"
import localFont from "next/font/local"

import { Provider } from "@/app/provider"
import { JsonLd } from "@/components/seo/json-ld"
import {
    organizationJsonLd,
    SITE_DESCRIPTION,
    SITE_NAME,
    siteOgImages,
    siteOrigin,
    siteTwitterImages,
} from "@/lib/seo"
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

const oxanium = Oxanium({
    subsets: ["latin"],
    variable: "--font-oxanium",
    display: "swap",
})

const appOrigin = siteOrigin()

export const metadata: Metadata = {
    metadataBase: new URL(appOrigin),
    title: {
        default: SITE_NAME,
        template: `%s · ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    applicationName: SITE_NAME,
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
        title: SITE_NAME,
        statusBarStyle: "black",
    },
    openGraph: {
        type: "website",
        siteName: SITE_NAME,
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        url: appOrigin,
        locale: "en_US",
        images: siteOgImages(),
    },
    twitter: {
        card: "summary_large_image",
        title: SITE_NAME,
        description: SITE_DESCRIPTION,
        images: siteTwitterImages(),
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
        <html
            lang="en"
            className={`${neueMontreal.variable} ${oxanium.variable} dark`}
        >
            <body>
                <JsonLd data={organizationJsonLd()} />
                <Provider>{children}</Provider>
            </body>
        </html>
    )
}
