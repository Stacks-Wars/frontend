export type StacksNetworkName = "testnet" | "mainnet"

export function getStacksNetworkName(): StacksNetworkName {
    const network = process.env.NEXT_PUBLIC_NETWORK ?? "testnet"

    if (network !== "testnet" && network !== "mainnet") {
        throw new Error(`Unsupported network: ${network}`)
    }

    return network
}
