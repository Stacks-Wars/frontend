"use client"

import * as React from "react"

import { EmptyState } from "@/components/ui"
import { cn } from "@/lib/utils"

export type ChartSeries = {
    key: string
    label: string
    color: string
    format?: (value: number) => string
}

type Point = Record<string, number | string>

const PAD = { top: 16, right: 12, bottom: 28, left: 44 }

function niceMax(value: number): number {
    if (value <= 0) return 1
    const exp = Math.floor(Math.log10(value))
    const mag = 10 ** exp
    const n = value / mag
    const nice = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
    return nice * mag
}

function ticks(max: number): number[] {
    return [0, 0.25, 0.5, 0.75, 1].map((p) => Math.round(p * max * 1000) / 1000)
}

function formatTick(value: number): string {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`
    if (Number.isInteger(value)) return String(value)
    return value.toFixed(1)
}

function linePath(
    data: Point[],
    key: string,
    max: number,
    width: number,
    height: number
): string {
    const innerW = width - PAD.left - PAD.right
    const innerH = height - PAD.top - PAD.bottom
    if (data.length === 0) return ""
    const step = data.length === 1 ? 0 : innerW / (data.length - 1)
    return data
        .map((point, i) => {
            const x = PAD.left + i * step
            const raw = Number(point[key] ?? 0)
            const y = PAD.top + innerH - (raw / max) * innerH
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`
        })
        .join(" ")
}

function areaPath(
    data: Point[],
    key: string,
    max: number,
    width: number,
    height: number
): string {
    const line = linePath(data, key, max, width, height)
    if (!line) return ""
    const innerW = width - PAD.left - PAD.right
    const base = height - PAD.bottom
    const step = data.length === 1 ? 0 : innerW / (data.length - 1)
    const lastX = PAD.left + (data.length - 1) * step
    return `${line} L${lastX.toFixed(1)},${base} L${PAD.left},${base} Z`
}

export function TrendChart({
    data,
    series,
    xKey,
    formatX,
    className,
    emptyTitle = "No data in this range",
    emptyDescription = "Try a wider window or clear a filter.",
}: {
    data: Point[]
    series: ChartSeries[]
    xKey: string
    formatX: (value: string | number) => string
    className?: string
    emptyTitle?: string
    emptyDescription?: string
}) {
    const width = 640
    const height = 220
    const [hover, setHover] = React.useState<number | null>(null)

    const max = React.useMemo(() => {
        let peak = 0
        for (const point of data) {
            for (const item of series) {
                peak = Math.max(peak, Number(point[item.key] ?? 0))
            }
        }
        return niceMax(peak)
    }, [data, series])

    const hasSignal = data.some((point) =>
        series.some((item) => Number(point[item.key] ?? 0) > 0)
    )

    if (data.length === 0 || !hasSignal) {
        return (
            <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                className="py-10"
            />
        )
    }

    const innerW = width - PAD.left - PAD.right
    const step = data.length === 1 ? 0 : innerW / (data.length - 1)
    const yTicks = ticks(max)
    const active = hover != null ? data[hover] : null
    const labelEvery = Math.max(1, Math.ceil(data.length / 6))

    return (
        <div className={cn("relative", className)}>
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="h-55 w-full overflow-visible"
                role="img"
                onMouseLeave={() => setHover(null)}
                onMouseMove={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect()
                    const x = ((event.clientX - rect.left) / rect.width) * width
                    const idx = Math.round((x - PAD.left) / (step || 1))
                    setHover(Math.max(0, Math.min(data.length - 1, idx)))
                }}
            >
                {yTicks.map((tick) => {
                    const y =
                        PAD.top +
                        (height - PAD.top - PAD.bottom) * (1 - tick / max)
                    return (
                        <g key={tick}>
                            <line
                                x1={PAD.left}
                                x2={width - PAD.right}
                                y1={y}
                                y2={y}
                                className="stroke-border/70"
                                strokeWidth={1}
                            />
                            <text
                                x={PAD.left - 8}
                                y={y + 3}
                                textAnchor="end"
                                className="fill-muted-foreground text-[10px]"
                            >
                                {formatTick(tick)}
                            </text>
                        </g>
                    )
                })}

                {data.map((point, i) => {
                    if (i % labelEvery !== 0 && i !== data.length - 1) return null
                    const x = PAD.left + i * step
                    return (
                        <text
                            key={i}
                            x={x}
                            y={height - 8}
                            textAnchor="middle"
                            className="fill-muted-foreground text-[10px]"
                        >
                            {formatX(point[xKey])}
                        </text>
                    )
                })}

                {series.map((item, index) => (
                    <g key={item.key}>
                        {index === 0 ? (
                            <path
                                d={areaPath(data, item.key, max, width, height)}
                                fill={item.color}
                                opacity={0.12}
                            />
                        ) : null}
                        <path
                            d={linePath(data, item.key, max, width, height)}
                            fill="none"
                            stroke={item.color}
                            strokeWidth={2}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                    </g>
                ))}

                {hover != null ? (
                    <line
                        x1={PAD.left + hover * step}
                        x2={PAD.left + hover * step}
                        y1={PAD.top}
                        y2={height - PAD.bottom}
                        className="stroke-foreground/40"
                        strokeWidth={1}
                        strokeDasharray="3 3"
                    />
                ) : null}

                {hover != null
                    ? series.map((item) => {
                          const raw = Number(data[hover]?.[item.key] ?? 0)
                          const y =
                              PAD.top +
                              (height - PAD.top - PAD.bottom) *
                                  (1 - raw / max)
                          return (
                              <circle
                                  key={item.key}
                                  cx={PAD.left + hover * step}
                                  cy={y}
                                  r={3.5}
                                  fill={item.color}
                                  className="stroke-background"
                                  strokeWidth={1.5}
                              />
                          )
                      })
                    : null}
            </svg>

            {active ? (
                <div className="pointer-events-none absolute top-2 right-2 rounded-lg border border-border bg-popover/95 px-2.5 py-1.5 text-xs shadow-lg">
                    <p className="text-muted-foreground">
                        {formatX(active[xKey])}
                    </p>
                    {series.map((item) => {
                        const value = Number(active[item.key] ?? 0)
                        const label = item.format
                            ? item.format(value)
                            : value.toLocaleString("en-US")
                        return (
                            <p key={item.key} className="flex items-center gap-2">
                                <span
                                    className="size-1.5 rounded-full"
                                    style={{ background: item.color }}
                                />
                                <span className="text-muted-foreground">
                                    {item.label}
                                </span>
                                <span className="tnum ml-auto">{label}</span>
                            </p>
                        )
                    })}
                </div>
            ) : null}

            <div className="mt-2 flex flex-wrap gap-4 px-1">
                {series.map((item) => (
                    <p
                        key={item.key}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground"
                    >
                        <span
                            className="size-1.5 rounded-full"
                            style={{ background: item.color }}
                        />
                        {item.label}
                    </p>
                ))}
            </div>
        </div>
    )
}
