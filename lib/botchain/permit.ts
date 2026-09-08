import "server-only"

import { hexToSignature, type Address, type Hex } from "viem"

import { usdtAbi } from "@/lib/botchain/abi"
import { getBotchainChainId } from "@/lib/botchain/network"
import { botchainPublicClient } from "@/lib/botchain/rpc"
import { botchainUsdt } from "@/lib/config"

type SignTypedData = (typed: {
    domain: {
        name: string
        version: string
        chainId: number
        verifyingContract: Address
    }
    types: Record<string, { name: string; type: string }[]>
    primaryType: string
    message: Record<string, unknown>
}) => Promise<Hex>

function secpV(value: bigint | number): number {
    const n = Number(value)
    return n < 27 ? n + 27 : n
}

export async function signBotchainUsdtPermit(input: {
    owner: Address
    spender: Address
    value: bigint
    signTypedData: SignTypedData
}): Promise<{ deadline: bigint; v: number; r: Hex; s: Hex }> {
    const usdt = botchainUsdt() as Address
    const client = botchainPublicClient()
    const [nonce, name] = await Promise.all([
        client.readContract({
            address: usdt,
            abi: usdtAbi,
            functionName: "nonces",
            args: [input.owner],
        }),
        client.readContract({
            address: usdt,
            abi: usdtAbi,
            functionName: "name",
        }),
    ])
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
    const signature = await input.signTypedData({
        domain: {
            name,
            version: "1",
            chainId: getBotchainChainId(),
            verifyingContract: usdt,
        },
        types: {
            Permit: [
                { name: "owner", type: "address" },
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" },
                { name: "nonce", type: "uint256" },
                { name: "deadline", type: "uint256" },
            ],
        },
        primaryType: "Permit",
        message: {
            owner: input.owner,
            spender: input.spender,
            value: input.value,
            nonce,
            deadline,
        },
    })
    const parsed = hexToSignature(signature)
    return {
        deadline,
        v: secpV(parsed.v ?? 27),
        r: parsed.r,
        s: parsed.s,
    }
}
