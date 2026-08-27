import type { ChainAdapter } from "@/lib/chain/types"

const STACKS_ADDRESS = /^S[0-9A-Z]{25,60}$/

export const stacksAdapter: ChainAdapter = {
    id: "stacks",
    label: "Stacks",
    playToken: "USDCx",
    parseAddress: (raw) => {
        const value = raw.trim().toUpperCase()
        return STACKS_ADDRESS.test(value) ? value : null
    },
    explorerTxUrl: (txid, network) => {
        const clean = txid.replace(/^0x/i, "")
        const chain = network === "mainnet" ? "mainnet" : "testnet"
        return `https://explorer.hiro.so/txid/0x${clean}?chain=${chain}`
    },
    explorerAccountUrl: (address, network) => {
        const chain = network === "mainnet" ? "mainnet" : "testnet"
        return `https://explorer.hiro.so/address/${address}?chain=${chain}`
    },
}
