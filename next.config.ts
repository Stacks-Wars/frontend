import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    env: {
        DISABLE_VERIFICATION: process.env.DISABLE_VERIFICATION ?? "",
        NETWORK: process.env.NETWORK ?? "",
        API_URL: process.env.API_URL ?? "",
        WS_URL: process.env.WS_URL ?? "",
        APP_URL: process.env.APP_URL ?? "",
    },
    experimental: {
        useOffline: true,
    },
    serverExternalPackages: [
        "@stacks/common",
        "@stacks/transactions",
        "@stacks/network",
        "@stacks/encryption",
        "@stacks/wallet-sdk",
        "@google-cloud/kms",
        "pg",
    ],
    transpilePackages: ["better-auth", "@better-auth/core"],
    async headers() {
        return [
            {
                source: "/(.*)",
                headers: [
                    { key: "X-Content-Type-Options", value: "nosniff" },
                    { key: "X-Frame-Options", value: "DENY" },
                    {
                        key: "Referrer-Policy",
                        value: "strict-origin-when-cross-origin",
                    },
                ],
            },
            {
                source: "/sw.js",
                headers: [
                    {
                        key: "Content-Type",
                        value: "application/javascript; charset=utf-8",
                    },
                    {
                        key: "Cache-Control",
                        value: "no-cache, no-store, must-revalidate",
                    },
                    {
                        key: "Content-Security-Policy",
                        value: "default-src 'self'; script-src 'self'",
                    },
                ],
            },
        ]
    },
}

export default nextConfig
