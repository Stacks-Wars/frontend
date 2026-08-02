import type { NextConfig } from "next"

const nextConfig: NextConfig = {
    // Expose local signup bypass to client components (OTP UI + fakeout).
    env: {
        DISABLE_VERIFICATION: process.env.DISABLE_VERIFICATION ?? "",
    },
    serverExternalPackages: [
        "@stacks/common",
        "@stacks/transactions",
        "@stacks/network",
        "@stacks/encryption",
        "@stacks/wallet-sdk",
        "@google-cloud/kms",
    ],
}

export default nextConfig
