import { getAddress } from "viem"

import type { ChainAdapter } from "@/lib/chain/types"
import { getBotchainNetworkName } from "@/lib/botchain/network"

const EVM_ADDRESS = /^0x[0-9a-fA-F]{40}$/

export const botchainAdapter: ChainAdapter = {
    id: "botchain",
    label: "BOT Chain",
    playToken: "USDT",
    playNetwork: () => getBotchainNetworkName(),
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
            network === "mainnet" ? "https://scan.botchain.ai" : "https://scan.bohr.life"
        return `${base}/tx/${txid}`
    },
    explorerAccountUrl: (address, network) => {
        const base =
            network === "mainnet" ? "https://scan.botchain.ai" : "https://scan.bohr.life"
        return `${base}/address/${address}`
    },
}
