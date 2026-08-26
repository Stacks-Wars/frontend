import { solanaAdapter } from "@/lib/chain/solana"
import { stacksAdapter } from "@/lib/chain/stacks"
import type { ChainAdapter, ChainId } from "@/lib/chain/types"

const ADAPTERS: Record<ChainId, ChainAdapter> = {
    stacks: stacksAdapter,
    solana: solanaAdapter,
}

export function chainAdapter(chain: ChainId): ChainAdapter {
    return ADAPTERS[chain]
}

export function explorerTxUrl(
    chain: ChainId,
    txid: string,
    network: string
): string {
    return chainAdapter(chain).explorerTxUrl(txid, network)
}
