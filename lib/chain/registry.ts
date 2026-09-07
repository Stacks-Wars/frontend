import { arbitrumAdapter } from "@/lib/chain/arbitrum"
import { solanaAdapter } from "@/lib/chain/solana"
import { stacksAdapter } from "@/lib/chain/stacks"
import type { ChainAdapter, ChainId } from "@/lib/chain/types"

const ADAPTERS: Record<ChainId, ChainAdapter> = {
    stacks: stacksAdapter,
    solana: solanaAdapter,
    arbitrum: arbitrumAdapter,
}

export function chainAdapter(chain: ChainId): ChainAdapter {
    return ADAPTERS[chain]
}

export function liveExplorerTxUrl(chain: ChainId, txid: string): string {
    const adapter = chainAdapter(chain)
    return adapter.explorerTxUrl(txid, adapter.playNetwork())
}
