import { chainAdapter, type ChainId } from "@/lib/chain"

/** Player-facing chain + network for deposit / withdraw copy. */
export function depositNetworkLabel(chain: ChainId): string {
    const network = chainAdapter(chain).playNetwork()
    switch (chain) {
        case "stacks":
            return network === "mainnet" ? "Stacks mainnet" : "Stacks testnet"
        case "solana":
            return network === "mainnet" || network === "mainnet-beta"
                ? "Solana"
                : "Solana Devnet"
        case "arbitrum":
            return network === "one" ? "Arbitrum One" : "Arbitrum Sepolia"
    }
}

export function depositFundsLead(chain: ChainId): string {
    const token = chainAdapter(chain).playToken
    return `Send ${token} on ${depositNetworkLabel(chain)} to this address.`
}

export function depositFundsWarn(chain: ChainId): string {
    const token = chainAdapter(chain).playToken
    return `${token} sent from another network or chain is lost.`
}
