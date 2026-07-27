import type { NextConfig } from "next"

const nextConfig: NextConfig = {
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
