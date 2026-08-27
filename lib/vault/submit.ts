"use server"

/**
 * Build + broadcast sponsored sw-vault-v1 contract calls from custodial keys.
 * Player signs as tx-sender; STACKS_WARS_KEY pays the fee.
 */

import {
    broadcastTransaction,
    Cl,
    makeContractCall,
    Pc,
    PostConditionMode,
    sponsorTransaction,
    type ClarityValue,
    type PostCondition,
} from "@stacks/transactions"
import { STACKS_MAINNET, STACKS_TESTNET } from "@stacks/network"

import { getSigningMaterial } from "@/lib/api/server"
import { chainAdapter, parseChainId, type ChainId } from "@/lib/chain"
import { provisionDestWallet } from "@/lib/custodial/provision-dest"
import { unlockCustodialAccount } from "@/lib/custodial/unlock"
import { waitForSolanaSignature } from "@/lib/solana/rpc"
import {
    solanaVaultClaim,
    solanaVaultJoin,
    solanaVaultKick,
    solanaVaultLeave,
} from "@/lib/solana/vault"
import { getStacksNetworkName } from "@/lib/stacks/network"
import { peekTx, waitForTx } from "@/lib/tx/wait-for-tx"
import { parseVaultContract, usdcxAsset } from "@/lib/vault/config"
import {
    humanizeVaultTxError,
    isIdempotentVaultSuccess,
    shouldDiscardVaultDraftOnFailure,
    VaultTxPendingError,
} from "@/lib/vault/tx-errors"
import {
    getPlatformAccount,
    getSponsorPrivateKey,
    signVaultClaimOracle,
    signVaultOracle,
} from "@/lib/vault/sign"

export type VaultDraftRef = {
    kind: string
    lobbyPath: string
}

async function discardDrafts(drafts?: VaultDraftRef[]) {
    if (!drafts?.length) return
    try {
        const { clearVaultDraft } = await import("@/lib/api/server")
        await Promise.all(
            drafts.map((draft) =>
                clearVaultDraft(draft.kind, draft.lobbyPath).catch(() => undefined)
            )
        )
    } catch (error) {
        console.error("[vault] failed to discard drafts", error)
    }
}

function stacksNetwork() {
    return getStacksNetworkName() === "mainnet" ? STACKS_MAINNET : STACKS_TESTNET
}

async function loadPlayerKey(userId: string) {
    return unlockCustodialAccount(await getSigningMaterial(userId, "stacks"))
}

async function broadcastSponsored(params: {
    senderKey: string
    functionName: string
    functionArgs: ClarityValue[]
    postConditions: PostCondition[]
    /**
     * Claim uses Allow: Clarity `as-contract?`/`with-ft` already pins each
     * split transfer, and Deny+willSendEq(total) aborts when those nested
     * eq conditions coexist with a second client-side eq on the same asset.
     */
    postConditionMode?: PostConditionMode
}) {
    const { address, name } = parseVaultContract()
    const network = stacksNetwork()
    const unsigned = await makeContractCall({
        contractAddress: address,
        contractName: name,
        functionName: params.functionName,
        functionArgs: params.functionArgs,
        senderKey: params.senderKey,
        network,
        sponsored: true,
        fee: 0,
        postConditionMode:
            params.postConditionMode ?? PostConditionMode.Deny,
        postConditions: params.postConditions,
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
    return String(result.txid)
}

/** Wait for a previously broadcast vault tx to confirm. */
export async function waitForVaultTx(
    txid: string,
    options?: {
        discardDraftsOnFailure?: VaultDraftRef[]
        maxWaitMs?: number
        chain?: ChainId
    }
): Promise<string> {
    if (parseChainId(options?.chain) === "solana") {
        return waitForSolanaSignature(txid, undefined, options?.maxWaitMs)
    }
    const wait = await waitForTx(txid, { maxWaitMs: options?.maxWaitMs })
    if (wait.status === "pending") {
        throw new VaultTxPendingError(txid)
    }
    if (wait.status === "failed") {
        if (isIdempotentVaultSuccess(wait.reason)) {
            return txid
        }
        if (shouldDiscardVaultDraftOnFailure(wait.reason)) {
            await discardDrafts(options?.discardDraftsOnFailure)
        }
        throw new Error(humanizeVaultTxError(wait.reason))
    }
    return txid
}

/**
 * Resume a draft txid only when it is still pending or already succeeded.
 * Failed aborts (u1, etc.) clear the draft and return null so the caller
 * can broadcast a fresh transaction.
 */
export async function resumeVaultTxOrDiscard(input: {
    txid: string
    drafts: VaultDraftRef[]
}): Promise<string | null> {
    const peek = await peekTx(input.txid)
    if (peek.status === "confirmed") {
        return input.txid
    }
    if (peek.status === "failed") {
        if (isIdempotentVaultSuccess(peek.reason)) {
            return input.txid
        }
        await discardDrafts(input.drafts)
        return null
    }
    // pending / unknown — wait; discard if it ultimately aborts
    try {
        return await waitForVaultTx(input.txid, {
            discardDraftsOnFailure: input.drafts,
        })
    } catch (error) {
        // Drafts already cleared inside waitForVaultTx on terminal failure.
        throw error
    }
}

export async function vaultJoinOnChain(input: {
    userId: string
    lobbyPath: string
    /** Lobby entry (always passed to contract). */
    entryAmountMicro: number
    /** Amount leaving custodial (0 for sponsored follow-up seats). */
    transferMicro: number
    sponsored: boolean
    chain?: ChainId
    /** When set, skip broadcast and wait on this existing txid. */
    resumeTxid?: string
    /**
     * When false, return the txid right after broadcast + draft persist
     * (caller waits). Default true.
     */
    wait?: boolean
}): Promise<string> {
    if (input.resumeTxid) {
        return waitForVaultTx(input.resumeTxid, {
            discardDraftsOnFailure: [
                { kind: "join", lobbyPath: input.lobbyPath },
                { kind: "create", lobbyPath: input.lobbyPath },
            ],
            chain: input.chain,
        })
    }
    if (parseChainId(input.chain) === "solana") {
        const txid = await solanaVaultJoin({
            userId: input.userId,
            lobbyPath: input.lobbyPath,
            amountMicro: input.transferMicro || input.entryAmountMicro,
        })
        try {
            const { saveVaultDraft } = await import("@/lib/api/server")
            await saveVaultDraft({
                kind: "join",
                lobbyPath: input.lobbyPath,
                txid,
                entryAmountMicro: input.entryAmountMicro,
                transferMicro: input.transferMicro,
                sponsored: input.sponsored,
            })
        } catch (error) {
            console.error("[vault] failed to persist join draft", error)
        }
        if (input.wait === false) {
            return txid
        }
        return waitForVaultTx(txid, {
            discardDraftsOnFailure: [
                { kind: "join", lobbyPath: input.lobbyPath },
                { kind: "create", lobbyPath: input.lobbyPath },
            ],
            chain: "solana",
        })
    }
    const player = await loadPlayerKey(input.userId)
    const { contractId, tokenName } = usdcxAsset()
    const postConditions: PostCondition[] =
        input.transferMicro > 0
            ? [
                  Pc.principal(player.address)
                      .willSendEq(input.transferMicro)
                      .ft(contractId, tokenName),
              ]
            : []
    const txid = await broadcastSponsored({
        senderKey: player.senderKey,
        functionName: "join",
        functionArgs: [
            Cl.stringAscii(input.lobbyPath),
            Cl.uint(input.entryAmountMicro),
            Cl.bool(input.sponsored),
        ],
        postConditions,
    })
    await player.persistV2IfNeeded()
    // Persist before waiting so a crash / verify failure can resume.
    // Terminal aborts (u1, etc.) discard this draft in waitForVaultTx.
    try {
        const { saveVaultDraft } = await import("@/lib/api/server")
        await saveVaultDraft({
            kind: "join",
            lobbyPath: input.lobbyPath,
            txid,
            entryAmountMicro: input.entryAmountMicro,
            transferMicro: input.transferMicro,
            sponsored: input.sponsored,
        })
    } catch (error) {
        console.error("[vault] failed to persist join draft", error)
    }
    if (input.wait === false) {
        return txid
    }
    return waitForVaultTx(txid, {
        discardDraftsOnFailure: [
            { kind: "join", lobbyPath: input.lobbyPath },
            { kind: "create", lobbyPath: input.lobbyPath },
        ],
    })
}

export async function vaultLeaveOnChain(input: {
    userId: string
    lobbyPath: string
    paidMicro: number
    nonce: number
    chain?: ChainId
    resumeTxid?: string
    lobbyId?: string
    /** When false, return after broadcast + draft persist. Default true. */
    wait?: boolean
}): Promise<string> {
    if (parseChainId(input.chain) === "solana") {
        const material = await getSigningMaterial(input.userId, "solana")
        return solanaVaultLeave({
            lobbyPath: input.lobbyPath,
            playerAddress: material.address,
        })
    }
    if (input.resumeTxid) {
        return waitForVaultTx(input.resumeTxid, {
            discardDraftsOnFailure: [
                { kind: "leave", lobbyPath: input.lobbyPath },
            ],
        })
    }
    const player = await loadPlayerKey(input.userId)
    const signature = await signVaultOracle({
        action: "leave",
        lobbyPath: input.lobbyPath,
        player: player.address,
        amount: input.paidMicro,
        nonce: input.nonce,
    })
    const { contractId, tokenName } = usdcxAsset()
    const { address, name } = parseVaultContract()
    const vaultId = `${address}.${name}` as `${string}.${string}`
    const postConditions: PostCondition[] =
        input.paidMicro > 0
            ? [
                  Pc.principal(vaultId)
                      .willSendEq(input.paidMicro)
                      .ft(contractId, tokenName),
              ]
            : []
    const txid = await broadcastSponsored({
        senderKey: player.senderKey,
        functionName: "leave",
        functionArgs: [
            Cl.stringAscii(input.lobbyPath),
            Cl.uint(input.nonce),
            Cl.bufferFromHex(signature.replace(/^0x/, "")),
        ],
        postConditions,
    })
    await player.persistV2IfNeeded()
    try {
        const { saveVaultDraft } = await import("@/lib/api/server")
        await saveVaultDraft({
            kind: "leave",
            lobbyPath: input.lobbyPath,
            lobbyId: input.lobbyId,
            txid,
            entryAmountMicro: input.paidMicro,
            paidMicro: input.paidMicro,
            nonce: input.nonce,
        })
    } catch (error) {
        console.error("[vault] failed to persist leave draft", error)
    }
    if (input.wait === false) return txid
    return waitForVaultTx(txid, {
        discardDraftsOnFailure: [
            { kind: "leave", lobbyPath: input.lobbyPath },
        ],
    })
}

export async function vaultKickOnChain(input: {
    actorUserId: string
    targetAddress: string
    lobbyPath: string
    paidMicro: number
    nonce: number
    chain?: ChainId
}): Promise<string> {
    if (parseChainId(input.chain) === "solana") {
        return solanaVaultKick({
            lobbyPath: input.lobbyPath,
            playerAddress: input.targetAddress,
        })
    }
    const player = await loadPlayerKey(input.actorUserId)
    const txid = await broadcastKick({
        senderKey: player.senderKey,
        targetAddress: input.targetAddress,
        lobbyPath: input.lobbyPath,
        paidMicro: input.paidMicro,
        nonce: input.nonce,
    })
    await player.persistV2IfNeeded()
    return waitForVaultTx(txid)
}

/** Platform-sponsored kick for the 24h lobby TTL janitor (any sender works). */
export async function vaultKickAsPlatform(input: {
    targetAddress: string
    lobbyPath: string
    paidMicro: number
    nonce: number
    chain?: ChainId
}): Promise<string> {
    if (parseChainId(input.chain) === "solana") {
        return solanaVaultKick({
            lobbyPath: input.lobbyPath,
            playerAddress: input.targetAddress,
        })
    }
    const platform = await getPlatformAccount()
    const txid = await broadcastKick({
        senderKey: platform.privateKey,
        targetAddress: input.targetAddress,
        lobbyPath: input.lobbyPath,
        paidMicro: input.paidMicro,
        nonce: input.nonce,
    })
    return waitForVaultTx(txid)
}

async function broadcastKick(input: {
    senderKey: string
    targetAddress: string
    lobbyPath: string
    paidMicro: number
    nonce: number
}): Promise<string> {
    const signature = await signVaultOracle({
        action: "kick",
        lobbyPath: input.lobbyPath,
        player: input.targetAddress,
        amount: input.paidMicro,
        nonce: input.nonce,
    })
    const { contractId, tokenName } = usdcxAsset()
    const { address, name } = parseVaultContract()
    const vaultId = `${address}.${name}` as `${string}.${string}`
    const postConditions: PostCondition[] =
        input.paidMicro > 0
            ? [
                  Pc.principal(vaultId)
                      .willSendEq(input.paidMicro)
                      .ft(contractId, tokenName),
              ]
            : []
    return broadcastSponsored({
        senderKey: input.senderKey,
        functionName: "kick",
        functionArgs: [
            Cl.stringAscii(input.lobbyPath),
            Cl.principal(input.targetAddress),
            Cl.uint(input.nonce),
            Cl.bufferFromHex(signature.replace(/^0x/, "")),
        ],
        postConditions,
    })
}

async function resolveClaimDest(input: {
    chain?: ChainId
    devWallet: string
    devFee: number
    devId?: string | null
    devNeedsWallet?: boolean
}): Promise<{ devWallet: string; devFee: number }> {
    const chain = parseChainId(input.chain)
    if (input.devNeedsWallet && input.devId) {
        try {
            const address = await provisionDestWallet(input.devId, chain)
            return { devWallet: address, devFee: input.devFee }
        } catch (error) {
            console.error("[vault] dev wallet provision failed", error)
            return { devWallet: input.devWallet, devFee: 0 }
        }
    }
    const parsed = chainAdapter(chain).parseAddress(input.devWallet)
    if (!parsed) {
        return { devWallet: input.devWallet, devFee: 0 }
    }
    return { devWallet: parsed, devFee: input.devFee }
}

export async function vaultClaimOnChain(input: {
    userId: string
    lobbyPath: string
    amountMicro: number
    nonce: number
    devWallet: string
    devFee: number
    devId?: string | null
    devNeedsWallet?: boolean
    lobbyId?: string
    resumeTxid?: string
    chain?: ChainId
}): Promise<string> {
    const dest = await resolveClaimDest(input)
    if (parseChainId(input.chain) === "solana") {
        const material = await getSigningMaterial(input.userId, "solana")
        return solanaVaultClaim({
            lobbyPath: input.lobbyPath,
            playerAddress: material.address,
            amountMicro: input.amountMicro,
            devFeePct: dest.devFee,
            devAddress: dest.devWallet,
        })
    }
    if (input.resumeTxid) {
        return waitForVaultTx(input.resumeTxid, {
            discardDraftsOnFailure: [
                { kind: "claim", lobbyPath: input.lobbyPath },
            ],
        })
    }
    const player = await loadPlayerKey(input.userId)
    const signature = await signVaultClaimOracle({
        lobbyPath: input.lobbyPath,
        player: player.address,
        amount: input.amountMicro,
        nonce: input.nonce,
        devWallet: dest.devWallet,
        devFee: dest.devFee,
    })
    // Split pays winner + platform + optional game fee. Nested Clarity
    // with-ft post-conditions cover each leg — client Deny+eq(total) races
    // them and aborts with abort_by_post_condition (seen on sponsored pots).
    const txid = await broadcastSponsored({
        senderKey: player.senderKey,
        functionName: "claim",
        functionArgs: [
            Cl.stringAscii(input.lobbyPath),
            Cl.uint(input.amountMicro),
            Cl.uint(input.nonce),
            Cl.principal(dest.devWallet),
            Cl.uint(dest.devFee),
            Cl.bufferFromHex(signature.replace(/^0x/, "")),
        ],
        postConditions: [],
        postConditionMode: PostConditionMode.Allow,
    })
    await player.persistV2IfNeeded()
    try {
        const { saveVaultDraft } = await import("@/lib/api/server")
        await saveVaultDraft({
            kind: "claim",
            lobbyPath: input.lobbyPath,
            lobbyId: input.lobbyId,
            txid,
            entryAmountMicro: 0,
            amountMicro: input.amountMicro,
            nonce: input.nonce,
            devWallet: dest.devWallet,
            devFee: dest.devFee,
            devId: input.devId,
            devNeedsWallet: input.devNeedsWallet,
        })
    } catch (error) {
        console.error("[vault] failed to persist claim draft", error)
    }
    return waitForVaultTx(txid, {
        discardDraftsOnFailure: [
            { kind: "claim", lobbyPath: input.lobbyPath },
        ],
    })
}
