/**
 * Vault path parsing + money floors. Contract ids live in `@/lib/config`.
 */

import {
    USDCX_ASSET_NAME,
    usdcxContract,
    vaultConfigured as isVaultConfigured,
    vaultContract,
} from "@/lib/config"

export const MIN_ENTRY_MICRO = 1_000_000
export const MIN_WITHDRAW_MICRO = 1_000_000
export const MAX_WITHDRAW_MICRO = 10_000_000_000

export { USDCX_ASSET_NAME }

export function getUsdcxContract(): string {
    return usdcxContract()
}

export function vaultConfigured(): boolean {
    return isVaultConfigured()
}

export function needsOnChainVault(entryAmountMicro: number): boolean {
    return entryAmountMicro > 0 && vaultConfigured()
}

export function parseVaultContract(): { address: string; name: string } {
    const id = vaultContract()
    const [address, name] = id.split(".")
    if (!address || !name) {
        throw new Error("Vault contract must be deployer.contract-name")
    }
    return { address, name }
}

export function usdcxAsset(): {
    contractId: `${string}.${string}`
    tokenName: string
} {
    return {
        contractId: usdcxContract() as `${string}.${string}`,
        tokenName: USDCX_ASSET_NAME,
    }
}
