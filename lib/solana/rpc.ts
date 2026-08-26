import "server-only"

import {
    createSolanaRpc,
    sendTransactionWithoutConfirmingFactory,
    type Signature,
} from "@solana/kit"

import { getSolanaRpcUrl } from "@/lib/solana/network"

export function solanaRpc() {
    return createSolanaRpc(getSolanaRpcUrl())
}

export function solanaSender() {
    return sendTransactionWithoutConfirmingFactory({ rpc: solanaRpc() })
}

export async function waitForSolanaSignature(
    signature: string,
    lastValidBlockHeight?: bigint,
    maxWaitMs = 45_000
): Promise<string> {
    const rpc = solanaRpc()
    const started = Date.now()
    while (Date.now() - started < maxWaitMs) {
        const { value } = await rpc
            .getSignatureStatuses([signature as Signature])
            .send()
        const status = value[0]
        if (status?.err) {
            throw new Error(
                `Solana transaction failed: ${JSON.stringify(status.err)}`
            )
        }
        if (
            status?.confirmationStatus === "confirmed" ||
            status?.confirmationStatus === "finalized"
        ) {
            return signature
        }
        if (lastValidBlockHeight !== undefined) {
            const height = await rpc.getBlockHeight().send()
            if (height > lastValidBlockHeight) {
                throw new Error("Solana blockhash expired before confirmation")
            }
        }
        await new Promise((resolve) => setTimeout(resolve, 400))
    }
    throw new Error("Timed out waiting for the Solana vault transaction")
}
