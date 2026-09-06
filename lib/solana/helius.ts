import "server-only"

import { solanaRpcUrl } from "@/lib/config"

export function getSolanaRpcUrl(): string {
    return solanaRpcUrl()
}
