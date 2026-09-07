import { getAddress } from "viem"

import type { ChainAdapter } from "@/lib/chain/types"
import { getArbitrumNetworkName } from "@/lib/arbitrum/network"

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/

export const arbitrumAdapter: ChainAdapter = {
    id: "arbitrum",
    label: "Arbitrum",
    playToken: "USDC",
    playNetwork: () => getArbitrumNetworkName(),
    parseAddress: (raw) => {
        const value = raw.trim()
        if (!EVM_ADDRESS.test(value)) return null
        try {
            return getAddress(value)
        } catch {
            return null
        }
    },
    explorerTxUrl: (txid, network) => {
        const base =
            network === "one" || network === "mainnet"
                ? "https://arbiscan.io"
                : "https://sepolia.arbiscan.io"
        return `${base}/tx/${txid}`
    },
    explorerAccountUrl: (address, network) => {
        const base =
            network === "one" || network === "mainnet"
                ? "https://arbiscan.io"
                : "https://sepolia.arbiscan.io"
        return `${base}/address/${address}`
    },
}
