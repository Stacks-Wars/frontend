import { arbitrum, arbitrumSepolia, type Chain } from "viem/chains"

import { isDev } from "@/lib/config"

export type ArbitrumNetworkName = "sepolia" | "one"

const ARBITRUM_SEPOLIA_CHAIN_ID = 421614
const ARBITRUM_ONE_CHAIN_ID = 42161
const ARBITRUM_SEPOLIA_RPC = "https://sepolia-rollup.arbitrum.io/rpc"
const ARBITRUM_ONE_RPC = "https://arb1.arbitrum.io/rpc"

/** Dest stays on Sepolia play USDC. Production is Arbitrum One + Circle USDC. */
export function getArbitrumNetworkName(): ArbitrumNetworkName {
    return isDev() ? "sepolia" : "one"
}

export function getArbitrumChainId(): number {
    return getArbitrumNetworkName() === "one"
        ? ARBITRUM_ONE_CHAIN_ID
        : ARBITRUM_SEPOLIA_CHAIN_ID
}

export function getArbitrumChain(): Chain {
    return getArbitrumNetworkName() === "one" ? arbitrum : arbitrumSepolia
}

export function getArbitrumRpcUrl(): string {
    return getArbitrumNetworkName() === "one"
        ? ARBITRUM_ONE_RPC
        : ARBITRUM_SEPOLIA_RPC
}
