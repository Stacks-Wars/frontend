import "server-only"

const TEMPLATE = "https://{network}.helius-rpc.com/"

function cluster(raw: string | undefined): "mainnet" | "devnet" {
    const network = raw?.trim().toLowerCase()
    if (network === "mainnet" || network === "mainnet-beta") return "mainnet"
    return "devnet"
}

/** Helius JSON-RPC URL with `HELIUS_API_KEY` attached. */
export function getSolanaRpcUrl(): string {
    const key = process.env.HELIUS_API_KEY?.trim()
    if (!key) {
        throw new Error("HELIUS_API_KEY must be set")
    }
    const raw = process.env.SOLANA_RPC_URL?.trim() ?? ""
    const template =
        !raw ||
        raw.includes("api.devnet.solana.com") ||
        raw.includes("api.mainnet-beta.solana.com") ||
        raw.includes("api.testnet.solana.com")
            ? TEMPLATE
            : raw
    const url = new URL(
        template.replaceAll("{network}", cluster(process.env.SOLANA_NETWORK))
    )
    url.searchParams.set("api-key", key)
    return url.toString()
}
