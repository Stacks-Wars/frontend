/**
 * Dest (`next dev`) is contributor fixtures. Main is production or NETWORK=main.
 * Main honors API_URL / WS_URL / APP_URL for a local `sw-server --main`.
 */

export const LOCAL_INTERNAL_API_SECRET = "sw-dev-internal"
export const LOCAL_DATABASE_URL =
    "postgres://postgres:postgres@127.0.0.1:5433/stacks_wars"
export const LOCAL_BETTER_AUTH_SECRET =
    "sw-dev-better-auth-secret-min-32-chars!"
export const LOCAL_CUSTODIAL_SECRET = "sw-dev-custodial-secret"
export const LOCAL_APP_URL = "http://localhost:3000"
export const LOCAL_API_URL = "http://127.0.0.1:8080"
export const LOCAL_WS_URL = "ws://127.0.0.1:8080/app"

/** Testnet play deployer + wallet_1 (PLATFORM-WALLET, oracle, minter). */
export const DEV_STACKS_DEPLOYER_MNEMONIC =
    "until divide segment regret hollow shallow gallery define position viable quality network sketch process warfare rescue elevator people ketchup crop height luxury betray public"
/** Same generated wallet_1 as the deployer. */
export const DEV_STACKS_ORACLE_MNEMONIC = DEV_STACKS_DEPLOYER_MNEMONIC
export const DEV_STACKS_DEPLOYER = "ST1S3D9BTK41ST9GRT225BQFFSYT6VMX7G7MNZ5FB"
export const DEV_USDCX_CONTRACT = `${DEV_STACKS_DEPLOYER}.usdcx-dev`
export const DEV_VAULT_CONTRACT = `${DEV_STACKS_DEPLOYER}.sw-vault-v1`
export const DEV_HIRO_API_URL = "https://api.testnet.hiro.so"

export const MAIN_USDCX_CONTRACT =
    "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx"
export const USDCX_ASSET_NAME = "usdcx-token"

export const DEV_SOLANA_MNEMONIC =
    "endless core tobacco mechanic have kiwi act issue page custom friend room"
export const DEV_SOLANA_RPC_URL = "https://api.devnet.solana.com"

/** Shared Devnet USDC mint + vault. Same IDs locally and in production. */
export const MAIN_SOLANA_USDC_MINT =
    "2ztYALhLWs2Lg1bGRBje82RgiLhuH4ZbCimRWVeyxUaB"
export const MAIN_SOLANA_VAULT_PROGRAM_ID =
    "8NZHj9VH9JkqiAg19CK43ZLuK5hn5jXPBnLfbeKonqfy"
export const MAIN_APP_URL = "https://www.stackswars.com"
export const MAIN_API_URL = "https://api.stackswars.com"
export const MAIN_WS_URL = "wss://api.stackswars.com/app"
export const MAIN_VAULT_CONTRACT =
    "SP299MBHT7FPPP2SKEY73V4DHW67467SED87A4HH4.sw-vault-v0-0-1"

function isMain(): boolean {
    const network = process.env.NETWORK?.trim().toLowerCase()
    return process.env.NODE_ENV === "production" || network === "main"
}

export function isDev(): boolean {
    return !isMain()
}

function read(name: string): string | undefined {
    const value = process.env[name]?.trim()
    return value || undefined
}

/** Dest uses the fixture. Main requires the real secret. */
export function env(name: string, local: string): string {
    if (isDev()) return local
    const value = read(name)
    if (value) return value
    throw new Error(`${name} must be set`)
}

export function optional(name: string): string | undefined {
    return read(name)
}

function publicUrl(value: string | undefined, fallback: string): string {
    return (value?.trim() || fallback).replace(/\/$/, "")
}

export function appUrl(): string {
    if (isDev()) return LOCAL_APP_URL
    return publicUrl(process.env.APP_URL, MAIN_APP_URL)
}

export function apiUrl(): string {
    if (isDev()) return LOCAL_API_URL.replace(/\/$/, "")
    return publicUrl(process.env.API_URL, MAIN_API_URL)
}

export function wsUrl(): string {
    if (isDev()) return LOCAL_WS_URL
    const explicit = process.env.WS_URL?.trim()
    if (explicit) return explicit.replace(/\/$/, "")
    const api = process.env.API_URL?.trim()
    if (api) {
        return `${api.replace(/^http/i, "ws").replace(/\/$/, "")}/app`
    }
    return MAIN_WS_URL
}

export function usdcxContract(): string {
    return isDev() ? DEV_USDCX_CONTRACT : MAIN_USDCX_CONTRACT
}

export function vaultContract(): string {
    return isDev() ? DEV_VAULT_CONTRACT : MAIN_VAULT_CONTRACT
}

export function vaultConfigured(): boolean {
    return Boolean(vaultContract())
}

export function hiroApiUrl(): string {
    return isDev() ? DEV_HIRO_API_URL : "https://api.hiro.so"
}

export function solanaMint(): string {
    return MAIN_SOLANA_USDC_MINT
}

export function solanaProgram(): string {
    return MAIN_SOLANA_VAULT_PROGRAM_ID
}

export function solanaRpcUrl(): string {
    const key = read("HELIUS_API_KEY")
    if (key) {
        return `https://devnet.helius-rpc.com/?api-key=${key}`
    }
    if (isDev()) return DEV_SOLANA_RPC_URL
    throw new Error("HELIUS_API_KEY must be set")
}
