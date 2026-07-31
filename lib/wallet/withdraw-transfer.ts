"use server"

/**
 * Broadcast a sponsored SIP-010 USDCx transfer from the custodial wallet.
 */

import {
    broadcastTransaction,
    Cl,
    makeContractCall,
    Pc,
    PostConditionMode,
    sponsorTransaction,
} from "@stacks/transactions"
import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network"

import { getSigningMaterial } from "@/lib/api/server"
import { decryptWithKms } from "@/lib/kms/envelope"
import { deriveCustodialAccountFromMnemonic } from "@/lib/stacks/wallet-from-mnemonic"
import { getStacksNetworkName } from "@/lib/stacks/network"
import { waitForTx } from "@/lib/tx/wait-for-tx"
import { getSponsorPrivateKey } from "@/lib/vault/sign"
import { USDCX_ASSET_NAME, USDCX_CONTRACT } from "@/lib/vault/config"

function stacksNetwork() {
    return getStacksNetworkName() === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET
}

export async function broadcastUsdcxTransfer(input: {
    userId: string
    amountMicro: number
    toAddress: string
    usdcxContract: string
}): Promise<string> {
    const material = await getSigningMaterial(input.userId)
    const mnemonic = await decryptWithKms(material.encryptedMnemonic)
    const account = await deriveCustodialAccountFromMnemonic(mnemonic)
    const tokenName = USDCX_ASSET_NAME
    const contractId = USDCX_CONTRACT
    const [contractAddress, contractName] = USDCX_CONTRACT.split(".")
    if (!contractAddress || !contractName) {
        throw new Error("Invalid hardcoded USDCX_CONTRACT")
    }
    const network = stacksNetwork()

    const unsigned = await makeContractCall({
        contractAddress,
        contractName,
        functionName: "transfer",
        functionArgs: [
            Cl.uint(input.amountMicro),
            Cl.principal(account.stxAddress),
            Cl.principal(input.toAddress),
            Cl.none(),
        ],
        senderKey: account.stxPrivateKey,
        network,
        sponsored: true,
        fee: 0,
        postConditionMode: PostConditionMode.Deny,
        postConditions: [
            Pc.principal(account.stxAddress)
                .willSendEq(input.amountMicro)
                .ft(contractId, tokenName),
        ],
    })
    const sponsored = await sponsorTransaction({
        transaction: unsigned,
        sponsorPrivateKey: await getSponsorPrivateKey(),
        fee: 10_000,
        network,
    })
    const result = await broadcastTransaction({
        transaction: sponsored,
        network,
    })
    if (!("txid" in result) || !result.txid) {
        const rejected = result as { error?: string; reason?: string }
        throw new Error(
            rejected.reason || rejected.error || "broadcast failed"
        )
    }
    const txid = String(result.txid)
    const wait = await waitForTx(txid)
    if (wait.status === "failed") {
        throw new Error(wait.reason ?? "withdrawal transaction failed")
    }
    return txid
}
