import { isDev } from "@/lib/config"

export type StacksNetworkName = "testnet" | "mainnet"

export function getStacksNetworkName(): StacksNetworkName {
    return isDev() ? "testnet" : "mainnet"
}
