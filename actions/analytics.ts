"use server"

import { getPlatformAnalytics } from "@/lib/api/server"
import type { AnalyticsQuery, AnalyticsReport } from "@/lib/api/types"

export async function getPlatformAnalyticsAction(
    query: AnalyticsQuery = {}
): Promise<AnalyticsReport> {
    return getPlatformAnalytics(query)
}
