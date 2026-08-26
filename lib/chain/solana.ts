import type { ChainAdapter } from "@/lib/chain/types"

/** Base58 pubkey, 32–44 chars. Not a full ed25519 check — enough for forms. */
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/

function cluster(network: string): "mainnet" | "devnet" | "testnet" {
    if (network === "mainnet" || network === "mainnet-beta") return "mainnet"
    if (network === "testnet") return "testnet"
    return "devnet"
}

export const solanaAdapter: ChainAdapter = {
    id: "solana",
    label: "Solana",
    playToken: "USDC",
    parseAddress: (raw) => {
        const value = raw.trim()
        return SOLANA_ADDRESS.test(value) ? value : null
    },
    explorerTxUrl: (txid, network) => {
        const c = cluster(network)
        const q = c === "mainnet" ? "" : `?cluster=${c}`
        return `https://explorer.solana.com/tx/${txid}${q}`
    },
    explorerAccountUrl: (address, network) => {
        const c = cluster(network)
        const q = c === "mainnet" ? "" : `?cluster=${c}`
        return `https://explorer.solana.com/address/${address}${q}`
    },
}
