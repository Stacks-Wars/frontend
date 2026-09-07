import "server-only"

import {
    createPublicClient,
    createWalletClient,
    http,
    type Account,
    type Hex,
    type PublicClient,
    type WalletClient,
} from "viem"
import { getArbitrumFeePayer } from "@/lib/arbitrum/fee-payer"
import { getArbitrumChain, getArbitrumRpcUrl } from "@/lib/arbitrum/network"

/** One platform EOA; parallel mint / join / claim must not share a nonce. */
let platformLock: Promise<void> = Promise.resolve()

function withArbitrumPlatformLock<T>(task: () => Promise<T>): Promise<T> {
    const run = platformLock.then(task, task)
    platformLock = run.then(
        () => undefined,
        () => undefined
    )
    return run
}

function isNonceCollision(error: unknown): boolean {
    const message = (error instanceof Error ? error.message : String(error)).toLowerCase()
    return (
        message.includes("nonce too low") ||
        (message.includes("nonce provided") && message.includes("lower than")) ||
        message.includes("replacement transaction underpriced")
    )
}

export function arbitrumPublicClient(): PublicClient {
    return createPublicClient({
        chain: getArbitrumChain(),
        transport: http(getArbitrumRpcUrl()),
    })
}

export function arbitrumWalletClient(account: Account): WalletClient {
    return createWalletClient({
        account,
        chain: getArbitrumChain(),
        transport: http(getArbitrumRpcUrl()),
    })
}

export async function waitForArbitrumTx(
    hash: Hex,
    maxWaitMs = 60_000
): Promise<Hex> {
    const client = arbitrumPublicClient()
    const receipt = await client.waitForTransactionReceipt({
        hash,
        timeout: maxWaitMs,
    })
    if (receipt.status !== "success") {
        throw new Error("Arbitrum transaction failed on-chain")
    }
    return hash
}

/**
 * Broadcast a platform-sponsored tx with a fresh pending nonce, then wait
 * for the receipt before the next sender runs. Retries once on a stale nonce.
 */
export async function sendArbitrumPlatformTx(
    write: (nonce: number) => Promise<Hex>
): Promise<Hex> {
    return withArbitrumPlatformLock(async () => {
        const client = arbitrumPublicClient()
        const account = getArbitrumFeePayer()
        const sendOnce = async () => {
            const nonce = await client.getTransactionCount({
                address: account.address,
                blockTag: "pending",
            })
            return write(nonce)
        }
        let hash: Hex
        try {
            hash = await sendOnce()
        } catch (error) {
            if (!isNonceCollision(error)) throw error
            hash = await sendOnce()
        }
        return waitForArbitrumTx(hash)
    })
}
