import { cookies } from "next/headers"

import { CHAIN_COOKIE } from "@/lib/chain/storage"
import { parseChainId, type ChainId } from "@/lib/chain/types"

export async function currentChainFromCookie(): Promise<ChainId> {
    const jar = await cookies()
    return parseChainId(jar.get(CHAIN_COOKIE)?.value)
}
