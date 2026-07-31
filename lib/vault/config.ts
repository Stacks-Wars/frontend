/**
 * Central vault helpers — config + path parsing for SW_VAULT_CONTRACT.
 * Product constants (USDCx, money floors) are hardcoded.
 */

export const MIN_ENTRY_MICRO = 1_000_000
export const MIN_WITHDRAW_MICRO = 1_000_000
export const MAX_WITHDRAW_MICRO = 10_000_000_000

export const USDCX_CONTRACT =
    "SP120SBRBQJ00MCWS7TM5R8WJNTTKD5K0HFRC2CNE.usdcx" as const

export const USDCX_ASSET_NAME = "usdcx-token" as const

export function vaultConfigured(): boolean {
    return Boolean(process.env.SW_VAULT_CONTRACT?.trim())
}

/** Paid/sponsored lobbies need an on-chain vault join when vault is deployed. */
export function needsOnChainVault(entryAmountMicro: number): boolean {
    return entryAmountMicro > 0 && vaultConfigured()
}

export function parseVaultContract(): { address: string; name: string } {
    const id = process.env.SW_VAULT_CONTRACT?.trim()
    if (!id || !id.includes(".")) {
        throw new Error("SW_VAULT_CONTRACT must be deployer.contract-name")
    }
    const [address, name] = id.split(".")
    if (!address || !name) {
        throw new Error("Invalid SW_VAULT_CONTRACT")
    }
    return { address, name }
}

export function usdcxAsset(): {
    contractId: `${string}.${string}`
    tokenName: string
} {
    return {
        contractId: USDCX_CONTRACT,
        tokenName: USDCX_ASSET_NAME,
    }
}
