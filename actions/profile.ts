"use server"

import { listUserMatches } from "@/lib/api/server"
import type { MatchHistoryItem } from "@/lib/api/types"

export async function listUserMatchesAction(
    userId: string,
    options: { limit?: number; offset?: number } = {}
): Promise<MatchHistoryItem[]> {
    return listUserMatches(userId, options)
}
