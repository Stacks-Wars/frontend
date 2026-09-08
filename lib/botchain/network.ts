import { defineChain, type Chain } from "viem"

import { isDev } from "@/lib/config"

export type BotchainNetworkName = "bohr" | "mainnet"

const BOTCHAIN_BOHR_ID = 968
const BOTCHAIN_MAIN_ID = 677
const BOTCHAIN_BOHR_RPC = "https://rpc.bohr.life"
const BOTCHAIN_MAIN_RPC = "https://rpc.botchain.ai"

const botchainBohr = defineChain({
    id: BOTCHAIN_BOHR_ID,
    name: "BOT Chain Bohr",
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
    rpcUrls: { default: { http: [BOTCHAIN_BOHR_RPC] } },
    blockExplorers: { default: { name: "BOTScan", url: "https://scan.bohr.life" } },
})

const botchainMainnet = defineChain({
    id: BOTCHAIN_MAIN_ID,
    name: "BOT Chain",
    nativeCurrency: { name: "BOT", symbol: "BOT", decimals: 18 },
    rpcUrls: { default: { http: [BOTCHAIN_MAIN_RPC] } },
    blockExplorers: { default: { name: "BOTScan", url: "https://scan.botchain.ai" } },
})

/** Dest stays on Bohr play USDT. Production is BOT Chain mainnet + official USDT. */
export function getBotchainNetworkName(): BotchainNetworkName {
    return isDev() ? "bohr" : "mainnet"
}

export function getBotchainChainId(): number {
    return getBotchainNetworkName() === "mainnet"
        ? BOTCHAIN_MAIN_ID
        : BOTCHAIN_BOHR_ID
}

export function getBotchainChain(): Chain {
    return getBotchainNetworkName() === "mainnet" ? botchainMainnet : botchainBohr
}

export function getBotchainRpcUrl(): string {
    return getBotchainNetworkName() === "mainnet"
        ? BOTCHAIN_MAIN_RPC
        : BOTCHAIN_BOHR_RPC
}
