import "server-only"

/**
 * Sponsored sw-vault calls on Solana. Platform key pays SOL (fees + rent);
 * the player only signs as USDC authority.
 *
 * @see https://solana.com/developers/cookbook/transactions/fee-sponsorship
 */

import { sha256 } from "@noble/hashes/sha256"
import { getCreateAssociatedTokenIdempotentInstruction } from "@solana-program/token"
import {
    AccountRole,
    address,
    getAddressEncoder,
    getProgramDerivedAddress,
    getSignatureFromTransaction,
    isAddress,
    type Address,
    type Instruction,
    type TransactionSigner,
} from "@solana/kit"

import { getSigningMaterial } from "@/lib/api/server"
import { unlockCustodialSolana } from "@/lib/custodial/unlock"
import { getSolanaFeePayer } from "@/lib/solana/fee-payer"
import { getSolanaUsdcMint } from "@/lib/solana/network"
import { solanaRpc, solanaSender, waitForSolanaSignature } from "@/lib/solana/rpc"
import { compileSponsoredTransaction } from "@/lib/solana/sponsor"

const TOKEN_PROGRAM = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
const ASSOCIATED_TOKEN_PROGRAM = address(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
)
const SYSTEM_PROGRAM = address("11111111111111111111111111111111")

function programId(): Address {
    const raw =
        process.env.SOLANA_VAULT_PROGRAM_ID?.trim() ||
        "8NZHj9VH9JkqiAg19CK43ZLuK5hn5jXPBnLfbeKonqfy"
    return address(raw)
}

export function lobbyPathHash(path: string): Uint8Array {
    return sha256(new TextEncoder().encode(path))
}

function discriminator(name: string): Uint8Array {
    return sha256(new TextEncoder().encode(`global:${name}`)).slice(0, 8)
}

function u64le(value: number | bigint): Uint8Array {
    const buf = new Uint8Array(8)
    new DataView(buf.buffer).setBigUint64(0, BigInt(value), true)
    return buf
}

function concatBytes(...parts: Uint8Array[]): Uint8Array {
    const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
    let offset = 0
    for (const part of parts) {
        out.set(part, offset)
        offset += part.length
    }
    return out
}

function asSolanaAddress(raw: string): Address | null {
    const value = raw.trim()
    return isAddress(value) ? address(value) : null
}

const addressEncoder = getAddressEncoder()

async function configPda() {
    const [pda] = await getProgramDerivedAddress({
        programAddress: programId(),
        seeds: ["config"],
    })
    return pda
}

async function escrowPda(pathHash: Uint8Array) {
    const [pda] = await getProgramDerivedAddress({
        programAddress: programId(),
        seeds: ["lobby", pathHash],
    })
    return pda
}

async function seatPda(pathHash: Uint8Array, player: Address) {
    const [pda] = await getProgramDerivedAddress({
        programAddress: programId(),
        seeds: ["seat", pathHash, addressEncoder.encode(player)],
    })
    return pda
}

async function ata(owner: Address, mint: Address) {
    const [pda] = await getProgramDerivedAddress({
        programAddress: ASSOCIATED_TOKEN_PROGRAM,
        seeds: [
            addressEncoder.encode(owner),
            addressEncoder.encode(TOKEN_PROGRAM),
            addressEncoder.encode(mint),
        ],
    })
    return pda
}

/** Distinct dest owner used when dest fee is 0 so dest_usdc ≠ platform_usdc. */
async function destFeeSkipDest(): Promise<Address> {
    const [pda] = await getProgramDerivedAddress({
        programAddress: programId(),
        seeds: ["dev-fee-skip"],
    })
    return pda
}

function createAtaIx(
    payer: TransactionSigner,
    owner: Address,
    ataAddress: Address,
    mint: Address
) {
    return getCreateAssociatedTokenIdempotentInstruction({
        payer,
        ata: ataAddress,
        owner,
        mint,
    })
}

function signerMeta(
    signer: TransactionSigner,
    role: AccountRole.WRITABLE_SIGNER | AccountRole.READONLY_SIGNER
) {
    return { address: signer.address, role, signer }
}

async function sendSponsored(instructions: Instruction[]) {
    const payer = await getSolanaFeePayer()
    const rpc = solanaRpc()
    const { value } = await rpc.getLatestBlockhash().send()
    const signed = await compileSponsoredTransaction({
        payer,
        instructions,
        lifetime: {
            blockhash: value.blockhash,
            lastValidBlockHeight: value.lastValidBlockHeight,
        },
    })
    await solanaSender()(signed, { commitment: "confirmed" })
    const signature = getSignatureFromTransaction(signed)
    return waitForSolanaSignature(signature, value.lastValidBlockHeight)
}

/** One-time: deployer is platform, USDC mint is locked, platform ATA created. */
export async function solanaVaultInitialize(): Promise<string> {
    const payer = await getSolanaFeePayer()
    const mint = address(getSolanaUsdcMint())
    const config = await configPda()
    const platformUsdc = await ata(payer.address, mint)

    const ix: Instruction = {
        programAddress: programId(),
        accounts: [
            signerMeta(payer, AccountRole.WRITABLE_SIGNER),
            { address: config, role: AccountRole.WRITABLE },
            { address: mint, role: AccountRole.READONLY },
            { address: platformUsdc, role: AccountRole.WRITABLE },
            { address: TOKEN_PROGRAM, role: AccountRole.READONLY },
            { address: ASSOCIATED_TOKEN_PROGRAM, role: AccountRole.READONLY },
            { address: SYSTEM_PROGRAM, role: AccountRole.READONLY },
        ],
        data: discriminator("initialize"),
    }
    return sendSponsored([ix])
}

export async function solanaVaultJoin(input: {
    userId: string
    lobbyPath: string
    amountMicro: number
}): Promise<string> {
    const material = await getSigningMaterial(input.userId, "solana")
    const player = await unlockCustodialSolana(material)
    const payer = await getSolanaFeePayer()
    const mint = address(getSolanaUsdcMint())
    const pathHash = lobbyPathHash(input.lobbyPath)
    const config = await configPda()
    const escrow = await escrowPda(pathHash)
    const seat = await seatPda(pathHash, player.signer.address)
    const playerUsdc = await ata(player.signer.address, mint)
    const vaultUsdc = await ata(escrow, mint)

    const ix: Instruction = {
        programAddress: programId(),
        accounts: [
            signerMeta(payer, AccountRole.WRITABLE_SIGNER),
            signerMeta(player.signer, AccountRole.READONLY_SIGNER),
            { address: config, role: AccountRole.READONLY },
            { address: mint, role: AccountRole.READONLY },
            { address: escrow, role: AccountRole.WRITABLE },
            { address: seat, role: AccountRole.WRITABLE },
            { address: playerUsdc, role: AccountRole.WRITABLE },
            { address: vaultUsdc, role: AccountRole.WRITABLE },
            { address: TOKEN_PROGRAM, role: AccountRole.READONLY },
            { address: ASSOCIATED_TOKEN_PROGRAM, role: AccountRole.READONLY },
            { address: SYSTEM_PROGRAM, role: AccountRole.READONLY },
        ],
        data: concatBytes(
            discriminator("join"),
            pathHash,
            u64le(input.amountMicro)
        ),
    }

    const signature = await sendSponsored([ix])
    await player.persistV2IfNeeded()
    return signature
}

export async function solanaVaultLeave(input: {
    lobbyPath: string
    playerAddress: string
}): Promise<string> {
    return solanaVaultRefund("leave", input)
}

export async function solanaVaultKick(input: {
    lobbyPath: string
    playerAddress: string
}): Promise<string> {
    return solanaVaultRefund("kick", input)
}

async function solanaVaultRefund(
    kind: "leave" | "kick",
    input: { lobbyPath: string; playerAddress: string }
): Promise<string> {
    const payer = await getSolanaFeePayer()
    const player = asSolanaAddress(input.playerAddress)
    if (!player) {
        throw new Error("Player wallet is not a Solana address.")
    }
    const mint = address(getSolanaUsdcMint())
    const pathHash = lobbyPathHash(input.lobbyPath)
    const config = await configPda()
    const escrow = await escrowPda(pathHash)
    const seat = await seatPda(pathHash, player)
    const playerUsdc = await ata(player, mint)
    const vaultUsdc = await ata(escrow, mint)

    const ix: Instruction = {
        programAddress: programId(),
        accounts: [
            signerMeta(payer, AccountRole.WRITABLE_SIGNER),
            { address: player, role: AccountRole.WRITABLE },
            { address: config, role: AccountRole.READONLY },
            { address: mint, role: AccountRole.READONLY },
            { address: escrow, role: AccountRole.WRITABLE },
            { address: seat, role: AccountRole.WRITABLE },
            { address: playerUsdc, role: AccountRole.WRITABLE },
            { address: vaultUsdc, role: AccountRole.WRITABLE },
            { address: TOKEN_PROGRAM, role: AccountRole.READONLY },
        ],
        data: discriminator(kind),
    }
    return sendSponsored([ix])
}

export async function solanaVaultClaim(input: {
    lobbyPath: string
    playerAddress: string
    amountMicro: number
    /** Percent 0–5. Platform 2% is computed on-chain. */
    devFeePct: number
    devAddress: string
}): Promise<string> {
    const payer = await getSolanaFeePayer()
    const player = asSolanaAddress(input.playerAddress)
    if (!player) {
        throw new Error("Player wallet is not a Solana address.")
    }
    const platform = address(payer.address)
    const parsedDev = asSolanaAddress(input.devAddress)
    // dest_usdc and platform_usdc are both mut TokenAccounts. Reusing the
    // platform key (0% dest fee / Stacks SP remap) fails simulation.
    const payDest =
        parsedDev != null &&
        parsedDev !== platform &&
        input.devFeePct > 0
    const dest = payDest ? parsedDev : await destFeeSkipDest()
    const devFeePct = payDest ? input.devFeePct : 0
    const mint = address(getSolanaUsdcMint())
    const pathHash = lobbyPathHash(input.lobbyPath)
    const config = await configPda()
    const escrow = await escrowPda(pathHash)
    const playerUsdc = await ata(player, mint)
    const destUsdc = await ata(dest, mint)

    const ix: Instruction = {
        programAddress: programId(),
        accounts: [
            signerMeta(payer, AccountRole.WRITABLE_SIGNER),
            { address: player, role: AccountRole.READONLY },
            { address: dest, role: AccountRole.READONLY },
            { address: config, role: AccountRole.READONLY },
            { address: mint, role: AccountRole.READONLY },
            { address: escrow, role: AccountRole.WRITABLE },
            { address: playerUsdc, role: AccountRole.WRITABLE },
            {
                address: await ata(payer.address, mint),
                role: AccountRole.WRITABLE,
            },
            { address: destUsdc, role: AccountRole.WRITABLE },
            { address: await ata(escrow, mint), role: AccountRole.WRITABLE },
            { address: TOKEN_PROGRAM, role: AccountRole.READONLY },
        ],
        data: concatBytes(
            discriminator("claim"),
            u64le(input.amountMicro),
            Uint8Array.of(devFeePct & 0xff)
        ),
    }
    return sendSponsored([
        createAtaIx(payer, player, playerUsdc, mint),
        createAtaIx(payer, dest, destUsdc, mint),
        ix,
    ])
}
