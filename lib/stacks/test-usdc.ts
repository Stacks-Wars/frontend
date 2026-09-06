import "server-only"

/**
 * Testnet play USDCx only. Mint $50 when the wallet is under $1.
 * Never touches mainnet SP120…usdcx.
 */

import {
    broadcastTransaction,
    Cl,
    makeContractCall,
    PostConditionMode,
} from "@stacks/transactions"
import { STACKS_TESTNET } from "@stacks/network"
import { generateWallet } from "@stacks/wallet-sdk"

import {
    DEV_STACKS_DEPLOYER,
    DEV_STACKS_ORACLE_MNEMONIC,
    MAIN_USDCX_CONTRACT,
    USDCX_ASSET_NAME,
    env,
    hiroApiUrl,
    isDev,
    usdcxContract,
} from "@/lib/config"
import { PLAY_CLAIM_MIN_MICRO, PLAY_MINT_MICRO } from "@/lib/chain/play"

export const STACKS_CLAIM_MIN_AMOUNT = PLAY_CLAIM_MIN_MICRO
export const STACKS_TEST_USDC_AMOUNT = PLAY_MINT_MICRO

function isDevUsdcx(contractId: string): boolean {
    return (
        contractId !== MAIN_USDCX_CONTRACT &&
        contractId.endsWith(".usdcx-dev")
    )
}

async function tokenBalance(address: string, contractId: string): Promise<bigint> {
    const asset = `${contractId}::${USDCX_ASSET_NAME}`
    const res = await fetch(
        `${hiroApiUrl()}/extended/v1/address/${address}/balances`
    )
    if (!res.ok) return BigInt(0)
    const body = (await res.json()) as {
        fungible_tokens?: Record<string, { balance?: string }>
    }
    const raw = body.fungible_tokens?.[asset]?.balance
    try {
        return BigInt(raw ?? 0)
    } catch {
        return BigInt(0)
    }
}

export function isStacksTestUsdcEnabled(): boolean {
    return isDev() && isDevUsdcx(usdcxContract())
}

export async function fundStacksTestUsdc(
    ownerAddress: string
): Promise<string | null> {
    if (!isStacksTestUsdcEnabled()) return null

    const contractId = usdcxContract()
    if (!isDevUsdcx(contractId)) {
        throw new Error("Refusing to mint mainnet USDCx")
    }

    const existing = await tokenBalance(ownerAddress, contractId)
    if (existing >= STACKS_CLAIM_MIN_AMOUNT) return null

    const wallet = await generateWallet({
        secretKey: env("STACKS_KEY", DEV_STACKS_ORACLE_MNEMONIC),
        password: "",
    })
    const senderKey = wallet.accounts[0]?.stxPrivateKey
    if (!senderKey) throw new Error("Failed to derive play minter")

    const [contractAddress, contractName] = contractId.split(".")
    if (contractAddress !== DEV_STACKS_DEPLOYER || !contractName) {
        throw new Error("Dev USDCx contract is not the Clarinet deployer token")
    }

    const tx = await makeContractCall({
        contractAddress,
        contractName,
        functionName: "mint",
        functionArgs: [
            Cl.uint(Number(STACKS_TEST_USDC_AMOUNT)),
            Cl.principal(ownerAddress),
        ],
        senderKey,
        network: STACKS_TESTNET,
        postConditionMode: PostConditionMode.Allow,
    })
    const result = await broadcastTransaction({
        transaction: tx,
        network: STACKS_TESTNET,
    })
    if (!("txid" in result) || !result.txid) {
        const rejected = result as { error?: string; reason?: string }
        throw new Error(rejected.reason || rejected.error || "mint broadcast failed")
    }
    return result.txid
}
