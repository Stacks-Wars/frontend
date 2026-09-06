"use server"

/**
 * Build + broadcast sponsored sw-vault-v1 contract calls from custodial keys.
 * Player signs as tx-sender; STACKS_KEY pays the fee.
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
import { chainAdapter, isChainId, type ChainId } from "@/lib/chain"
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
import {
    findSuccessfulVaultCall,
    peekTx,
    waitForTx,
    type VaultCallLookup,
} from "@/lib/tx/wait-for-tx"
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

function requireVaultChain(chain?: ChainId): ChainId {
    if (chain && isChainId(chain)) return chain
    throw new Error("Vault operation is missing a chain")
}

function assertStacksVault(
    chain: ChainId
): asserts chain is Extract<ChainId, "stacks"> {
    if (chain !== "stacks") {
        throw new Error(`No vault on ${chain}`)
    }
}

/** Prefer the explicit chain. 64-hex is Stacks; do not use parseChainId. */
function resolveVaultWaitChain(
    chain: ChainId | undefined,
    txid: string
): ChainId {
    if (chain && isChainId(chain)) return chain
    return /^[0-9a-fA-F]{64}$/.test(txid.trim()) ? "stacks" : "solana"
}

/** One sponsor account; parallel claims must not share a nonce. */
let sponsorLock: Promise<void> = Promise.resolve()

function withSponsorLock<T>(task: () => Promise<T>): Promise<T> {
    const run = sponsorLock.then(task, task)
    sponsorLock = run.then(
        () => undefined,
        () => undefined
    )
    return run
}

async function recoverVaultTx(
    lookup: VaultCallLookup | undefined
): Promise<string | null> {
    if (!lookup) return null
    return findSuccessfulVaultCall(lookup)
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
    return withSponsorLock(async () => {
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
    })
}

/** Wait for a previously broadcast vault tx to confirm. */
export async function waitForVaultTx(
    txid: string,
    options?: {
        discardDraftsOnFailure?: VaultDraftRef[]
        maxWaitMs?: number
        chain?: ChainId
        recover?: VaultCallLookup
    }
): Promise<string> {
    const chain = resolveVaultWaitChain(options?.chain, txid)
    switch (chain) {
        case "solana":
            return waitForSolanaSignature(txid, undefined, options?.maxWaitMs)
        case "stacks":
            break
    }
    const wait = await waitForTx(txid, { maxWaitMs: options?.maxWaitMs })
    if (wait.status === "pending") {
        const landed = await recoverVaultTx(options?.recover)
        if (landed) return landed
        throw new VaultTxPendingError(txid)
    }
    if (wait.status === "failed") {
        if (isIdempotentVaultSuccess(wait.reason)) {
            const landed = await recoverVaultTx(options?.recover)
            if (landed) return landed
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
    chain?: ChainId
    recover?: VaultCallLookup
}): Promise<string | null> {
    const chain = resolveVaultWaitChain(input.chain, input.txid)
    if (chain === "solana") {
        return waitForVaultTx(input.txid, {
            discardDraftsOnFailure: input.drafts,
            chain,
        })
    }
    const landed = await recoverVaultTx(input.recover)
    if (landed) return landed
    const peek = await peekTx(input.txid)
    if (peek.status === "confirmed") {
        return input.txid
    }
    if (peek.status === "failed") {
        if (isIdempotentVaultSuccess(peek.reason)) {
            return (await recoverVaultTx(input.recover)) ?? input.txid
        }
        await discardDrafts(input.drafts)
        return null
    }
    // Hiro 404 — the draft txid never landed. Rebroadcast instead of
    // waiting 50s and telling the player it is still processing.
    if (peek.status === "unknown") {
        await discardDrafts(input.drafts)
        return null
    }
    try {
        return await waitForVaultTx(input.txid, {
            discardDraftsOnFailure: input.drafts,
            chain,
            recover: input.recover,
        })
    } catch (error) {
        if (error instanceof VaultTxPendingError) {
            const recovered = await recoverVaultTx(input.recover)
            if (recovered) return recovered
            await discardDrafts(input.drafts)
            return null
        }
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
    const chain = requireVaultChain(input.chain)
    if (chain === "solana") {
        if (input.resumeTxid) {
            return waitForVaultTx(input.resumeTxid, {
                discardDraftsOnFailure: [
                    { kind: "join", lobbyPath: input.lobbyPath },
                    { kind: "create", lobbyPath: input.lobbyPath },
                ],
                chain,
            })
        }
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
            chain,
        })
    }
    assertStacksVault(chain)
    const player = await loadPlayerKey(input.userId)
    const recover: VaultCallLookup = {
        sender: player.address,
        functionName: "join",
        lobbyPath: input.lobbyPath,
    }
    const already = await recoverVaultTx(recover)
    if (already) return already
    if (input.resumeTxid) {
        return waitForVaultTx(input.resumeTxid, {
            discardDraftsOnFailure: [
                { kind: "join", lobbyPath: input.lobbyPath },
                { kind: "create", lobbyPath: input.lobbyPath },
            ],
            chain: "stacks",
            recover,
        })
    }
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
        chain: "stacks",
        recover,
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
    const chain = requireVaultChain(input.chain)
    if (chain === "solana") {
        const material = await getSigningMaterial(input.userId, "solana")
        return solanaVaultLeave({
            lobbyPath: input.lobbyPath,
            playerAddress: material.address,
        })
    }
    assertStacksVault(chain)
    if (input.resumeTxid) {
        return waitForVaultTx(input.resumeTxid, {
            discardDraftsOnFailure: [
                { kind: "leave", lobbyPath: input.lobbyPath },
            ],
            chain: "stacks",
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
        chain: "stacks",
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
    const chain = requireVaultChain(input.chain)
    if (chain === "solana") {
        return solanaVaultKick({
            lobbyPath: input.lobbyPath,
            playerAddress: input.targetAddress,
        })
    }
    assertStacksVault(chain)
    const player = await loadPlayerKey(input.actorUserId)
    const txid = await broadcastKick({
        senderKey: player.senderKey,
        targetAddress: input.targetAddress,
        lobbyPath: input.lobbyPath,
        paidMicro: input.paidMicro,
        nonce: input.nonce,
    })
    await player.persistV2IfNeeded()
    return waitForVaultTx(txid, { chain: "stacks" })
}

/** Platform-sponsored kick for the 24h lobby TTL janitor (any sender works). */
export async function vaultKickAsPlatform(input: {
    targetAddress: string
    lobbyPath: string
    paidMicro: number
    nonce: number
    chain?: ChainId
}): Promise<string> {
    const chain = requireVaultChain(input.chain)
    if (chain === "solana") {
        return solanaVaultKick({
            lobbyPath: input.lobbyPath,
            playerAddress: input.targetAddress,
        })
    }
    assertStacksVault(chain)
    const platform = await getPlatformAccount()
    const txid = await broadcastKick({
        senderKey: platform.privateKey,
        targetAddress: input.targetAddress,
        lobbyPath: input.lobbyPath,
        paidMicro: input.paidMicro,
        nonce: input.nonce,
    })
    return waitForVaultTx(txid, { chain: "stacks" })
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
    const chain = requireVaultChain(input.chain)
    if (input.devNeedsWallet && input.devId) {
        try {
            const address = await provisionDestWallet(input.devId, chain)
            const provisioned = chainAdapter(chain).parseAddress(address)
            if (provisioned) {
                return { devWallet: provisioned, devFee: input.devFee }
            }
        } catch (error) {
            console.error("[vault] dev wallet provision failed", error)
        }
    }
    const parsed = chainAdapter(chain).parseAddress(input.devWallet)
    if (parsed && input.devFee > 0) {
        return { devWallet: parsed, devFee: input.devFee }
    }
    if (chain === "stacks") {
        const platform = await getPlatformAccount()
        return { devWallet: platform.address, devFee: 0 }
    }
    return { devWallet: parsed ?? input.devWallet, devFee: 0 }
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
    const chain = requireVaultChain(input.chain)
    if (chain === "solana") {
        const material = await getSigningMaterial(input.userId, "solana")
        return solanaVaultClaim({
            lobbyPath: input.lobbyPath,
            playerAddress: material.address,
            amountMicro: input.amountMicro,
            devFeePct: dest.devFee,
            devAddress: dest.devWallet,
        })
    }
    assertStacksVault(chain)
    const player = await loadPlayerKey(input.userId)
    const recover: VaultCallLookup = {
        sender: player.address,
        functionName: "claim",
        lobbyPath: input.lobbyPath,
    }
    if (input.resumeTxid) {
        return waitForVaultTx(input.resumeTxid, {
            discardDraftsOnFailure: [
                { kind: "claim", lobbyPath: input.lobbyPath },
            ],
            chain: "stacks",
            recover,
        })
    }
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
        chain: "stacks",
        recover,
    })
}
