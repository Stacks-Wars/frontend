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
import { getBotchainFeePayer } from "@/lib/botchain/fee-payer"
import { getBotchainChain, getBotchainRpcUrl } from "@/lib/botchain/network"

/** One platform EOA; parallel mint / join / claim must not share a nonce. */
let platformLock: Promise<void> = Promise.resolve()

function withBotchainPlatformLock<T>(task: () => Promise<T>): Promise<T> {
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

export function botchainPublicClient(): PublicClient {
    return createPublicClient({
        chain: getBotchainChain(),
        transport: http(getBotchainRpcUrl()),
    })
}

export function botchainWalletClient(account: Account): WalletClient {
    return createWalletClient({
        account,
        chain: getBotchainChain(),
        transport: http(getBotchainRpcUrl()),
    })
}

export async function waitForBotchainTx(
    hash: Hex,
    maxWaitMs = 60_000
): Promise<Hex> {
    const client = botchainPublicClient()
    const receipt = await client.waitForTransactionReceipt({
        hash,
        timeout: maxWaitMs,
    })
    if (receipt.status !== "success") {
        throw new Error("BOT Chain transaction failed on-chain")
    }
    return hash
}

/**
 * Broadcast a platform-sponsored tx with a fresh pending nonce, then wait
 * for the receipt before the next sender runs. Retries once on a stale nonce.
 * BOT Chain uses a zero base fee; send as legacy so gas estimation matches.
 */
export async function sendBotchainPlatformTx(
    write: (nonce: number, gasPrice: bigint) => Promise<Hex>
): Promise<Hex> {
    return withBotchainPlatformLock(async () => {
        const client = botchainPublicClient()
        const account = getBotchainFeePayer()
        const sendOnce = async () => {
            const [nonce, gasPrice] = await Promise.all([
                client.getTransactionCount({
                    address: account.address,
                    blockTag: "pending",
                }),
                client.getGasPrice(),
            ])
            return write(nonce, gasPrice)
        }
        let hash: Hex
        try {
            hash = await sendOnce()
        } catch (error) {
            if (!isNonceCollision(error)) throw error
            hash = await sendOnce()
        }
        return waitForBotchainTx(hash)
    })
}
