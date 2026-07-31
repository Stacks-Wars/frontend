import {
    RiCoinLine,
    RiLineChartLine,
    RiSwordLine,
    RiTrophyLine,
} from "@remixicon/react"

import { Stat } from "@/components/ui"
import type { LifetimeTotals } from "@/lib/api/types"
import { formatUsdc } from "@/lib/format"

export function ProfileStats({ lifetime }: { lifetime: LifetimeTotals }) {
    const winRate =
        lifetime.totalMatches > 0
            ? (lifetime.totalWins / lifetime.totalMatches) * 100
            : 0
    const pnl = lifetime.totalPnlMicro
    const pnlLabel = formatUsdc(pnl, { sign: true, zero: "$0.00" })

    return (
        <div className="grid grid-cols-2 gap-5 rounded-2xl border border-border/70 p-5 surface-raised lg:grid-cols-4">
            <Stat
                icon={<RiSwordLine />}
                label="Matches"
                value={lifetime.totalMatches.toLocaleString("en-US")}
            />
            <Stat
                icon={<RiTrophyLine />}
                label="Wins"
                value={lifetime.totalWins.toLocaleString("en-US")}
                hint={`${winRate.toFixed(1)}% win rate`}
            />
            <Stat
                icon={<RiCoinLine />}
                label="Winnings"
                tone="gold"
                value={formatUsdc(lifetime.totalWinningsMicro, {
                    zero: "$0.00",
                })}
            />
            <Stat
                icon={<RiLineChartLine />}
                label="Net P&L"
                tone={pnl > 0 ? "success" : "default"}
                value={
                    pnl < 0 ? (
                        <span className="text-destructive">{pnlLabel}</span>
                    ) : (
                        pnlLabel
                    )
                }
            />
        </div>
    )
}
