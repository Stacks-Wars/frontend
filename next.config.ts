import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    // Expose local signup bypass to client components (OTP UI + fakeout).
    env: {
        DISABLE_VERIFICATION: process.env.DISABLE_VERIFICATION ?? "",
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
    ],
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
