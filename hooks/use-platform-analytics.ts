"use client"

import { useQuery } from "@tanstack/react-query"

import { getPlatformAnalyticsAction } from "@/actions/analytics"
import type { AnalyticsQuery, AnalyticsReport } from "@/lib/api/types"

export const ANALYTICS_KEY = ["analytics"] as const

export function analyticsQueryKey(query: AnalyticsQuery) {
    return [
        ...ANALYTICS_KEY,
        query.seasonId ?? null,
        query.from ?? null,
        query.to ?? null,
        query.gameId ?? null,
        query.chain ?? null,
    ] as const
}

export function usePlatformAnalytics(query: AnalyticsQuery) {
    return useQuery<AnalyticsReport>({
        queryKey: analyticsQueryKey(query),
        queryFn: () => getPlatformAnalyticsAction(query),
        staleTime: 30_000,
        retry: false,
    })
}
