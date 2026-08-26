/**
 * One-shot: initialize sw-vault on the cluster. Payer + platform =
 * SOLANA_WARS_KEY. Mint = SOLANA_USDC_MINT or the platform test USDC.
 *
 *   cd frontend && node scripts/initialize-solana-vault.mjs
 */
import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { mnemonicToSeedSync } from "@scure/bip39"
import { derivePath } from "ed25519-hd-key"
import { sha256 } from "@noble/hashes/sha256"
import {
    AccountRole,
    address,
    appendTransactionMessageInstructions,
    createKeyPairSignerFromPrivateKeyBytes,
    createSolanaRpc,
    createTransactionMessage,
    getAddressEncoder,
    getProgramDerivedAddress,
    getSignatureFromTransaction,
    pipe,
    sendTransactionWithoutConfirmingFactory,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
} from "@solana/kit"

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..")
const ENV_PATH = resolve(ROOT, "frontend/.env.local")
const PROGRAM_ID = "8NZHj9VH9JkqiAg19CK43ZLuK5hn5jXPBnLfbeKonqfy"
const TEST_USDC = "2ztYALhLWs2Lg1bGRBje82RgiLhuH4ZbCimRWVeyxUaB"
const TOKEN_PROGRAM = address("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA")
const ASSOCIATED_TOKEN_PROGRAM = address(
    "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
)
const SYSTEM_PROGRAM = address("11111111111111111111111111111111")
const PATH = "m/44'/501'/0'/0'"

function loadEnv(path) {
    let text
    try {
        text = readFileSync(path, "utf8")
    } catch {
        return
    }
    for (const line of text.split("\n")) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith("#")) continue
        const eq = trimmed.indexOf("=")
        if (eq < 0) continue
        const key = trimmed.slice(0, eq).trim()
        let value = trimmed.slice(eq + 1).trim()
        if (
            (value.startsWith("'") && value.endsWith("'")) ||
            (value.startsWith('"') && value.endsWith('"'))
        ) {
            value = value.slice(1, -1)
        }
        if (!(key in process.env)) process.env[key] = value
    }
}

function discriminator(name) {
    return sha256(new TextEncoder().encode(`global:${name}`)).slice(0, 8)
}

loadEnv(ENV_PATH)

const mnemonic = process.env.SOLANA_WARS_KEY?.trim()
if (!mnemonic) {
    throw new Error("SOLANA_WARS_KEY is missing")
}

const rpcUrl =
    process.env.SOLANA_RPC_URL?.trim() || "https://api.devnet.solana.com"
const mint = address(process.env.SOLANA_USDC_MINT?.trim() || TEST_USDC)
const program = address(
    process.env.SOLANA_VAULT_PROGRAM_ID?.trim() || PROGRAM_ID
)

const seed = mnemonicToSeedSync(mnemonic)
const { key } = derivePath(PATH, Buffer.from(seed).toString("hex"))
const payer = await createKeyPairSignerFromPrivateKeyBytes(Uint8Array.from(key))

const rpc = createSolanaRpc(rpcUrl)
const sender = sendTransactionWithoutConfirmingFactory({ rpc })
const addressEncoder = getAddressEncoder()

const [config] = await getProgramDerivedAddress({
    programAddress: program,
    seeds: ["config"],
})
const [platformUsdc] = await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM,
    seeds: [
        addressEncoder.encode(payer.address),
        addressEncoder.encode(TOKEN_PROGRAM),
        addressEncoder.encode(mint),
    ],
})

const ix = {
    programAddress: program,
    accounts: [
        {
            address: payer.address,
            role: AccountRole.WRITABLE_SIGNER,
            signer: payer,
        },
        { address: config, role: AccountRole.WRITABLE },
        { address: mint, role: AccountRole.READONLY },
        { address: platformUsdc, role: AccountRole.WRITABLE },
        { address: TOKEN_PROGRAM, role: AccountRole.READONLY },
        { address: ASSOCIATED_TOKEN_PROGRAM, role: AccountRole.READONLY },
        { address: SYSTEM_PROGRAM, role: AccountRole.READONLY },
    ],
    data: discriminator("initialize"),
}

const { value } = await rpc.getLatestBlockhash().send()
const signed = await signTransactionMessageWithSigners(
    pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(payer, tx),
        (tx) =>
            setTransactionMessageLifetimeUsingBlockhash(
                {
                    blockhash: value.blockhash,
                    lastValidBlockHeight: value.lastValidBlockHeight,
                },
                tx
            ),
        (tx) => appendTransactionMessageInstructions([ix], tx)
    )
)

await sender(signed, { commitment: "confirmed" })
const signature = getSignatureFromTransaction(signed)

const started = Date.now()
while (Date.now() - started < 45_000) {
    const { value: statuses } = await rpc
        .getSignatureStatuses([signature])
        .send()
    const status = statuses[0]
    if (status?.err) {
        throw new Error(`initialize failed: ${JSON.stringify(status.err)}`)
    }
    if (
        status?.confirmationStatus === "confirmed" ||
        status?.confirmationStatus === "finalized"
    ) {
        console.log(`initialized vault. mint=${mint} sig=${signature}`)
        process.exit(0)
    }
    await new Promise((r) => setTimeout(r, 400))
}

throw new Error("timed out waiting for initialize")
