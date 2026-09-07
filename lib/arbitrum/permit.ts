import "server-only"

import { randomBytes } from "node:crypto"
import { hexToSignature, toHex, type Address, type Hex } from "viem"

import { usdCxAbi } from "@/lib/arbitrum/abi"
import { getArbitrumChainId, getArbitrumNetworkName } from "@/lib/arbitrum/network"
import { arbitrumPublicClient } from "@/lib/arbitrum/rpc"
import { arbitrumUsdc } from "@/lib/config"

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

async function usdcPermitDomain(): Promise<{
    name: string
    version: string
    chainId: number
    verifyingContract: Address
}> {
    const usdc = arbitrumUsdc() as Address
    const client = arbitrumPublicClient()
    const name = await client.readContract({
        address: usdc,
        abi: usdCxAbi,
        functionName: "name",
    })
    const version =
        getArbitrumNetworkName() === "one"
            ? await client
                  .readContract({
                      address: usdc,
                      abi: usdCxAbi,
                      functionName: "version",
                  })
                  .catch(() => "2")
            : "1"
    return {
        name,
        version,
        chainId: getArbitrumChainId(),
        verifyingContract: usdc,
    }
}

export async function signArbitrumUsdcPermit(input: {
    owner: Address
    spender: Address
    value: bigint
    signTypedData: SignTypedData
}): Promise<{ deadline: bigint; v: number; r: Hex; s: Hex }> {
    const usdc = arbitrumUsdc() as Address
    const client = arbitrumPublicClient()
    const [nonce, domain] = await Promise.all([
        client.readContract({
            address: usdc,
            abi: usdCxAbi,
            functionName: "nonces",
            args: [input.owner],
        }),
        usdcPermitDomain(),
    ])
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 3600)
    const signature = await input.signTypedData({
        domain,
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

/** Circle USDC (Arbitrum One): one sponsored tx, no prior allowance. */
export async function signArbitrumUsdcTransferAuth(input: {
    from: Address
    to: Address
    value: bigint
    signTypedData: SignTypedData
}): Promise<{
    validAfter: bigint
    validBefore: bigint
    nonce: Hex
    v: number
    r: Hex
    s: Hex
}> {
    const domain = await usdcPermitDomain()
    const validAfter = BigInt(0)
    const validBefore = BigInt(Math.floor(Date.now() / 1000) + 3600)
    const nonce = toHex(randomBytes(32))
    const signature = await input.signTypedData({
        domain,
        types: {
            TransferWithAuthorization: [
                { name: "from", type: "address" },
                { name: "to", type: "address" },
                { name: "value", type: "uint256" },
                { name: "validAfter", type: "uint256" },
                { name: "validBefore", type: "uint256" },
                { name: "nonce", type: "bytes32" },
            ],
        },
        primaryType: "TransferWithAuthorization",
        message: {
            from: input.from,
            to: input.to,
            value: input.value,
            validAfter,
            validBefore,
            nonce,
        },
    })
    const parsed = hexToSignature(signature)
    return {
        validAfter,
        validBefore,
        nonce,
        v: secpV(parsed.v ?? 27),
        r: parsed.r,
        s: parsed.s,
    }
}
