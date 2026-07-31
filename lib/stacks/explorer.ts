import { getStacksNetworkName } from "@/lib/stacks/network"

/** Hiro explorer transaction URL for the configured Stacks network. */
export function hiroExplorerTxUrl(txid: string): string {
    const clean = txid.replace(/^0x/i, "")
    const network = getStacksNetworkName()
    const chain = network === "mainnet" ? "mainnet" : "testnet"
    return `https://explorer.hiro.so/txid/0x${clean}?chain=${chain}`
}
