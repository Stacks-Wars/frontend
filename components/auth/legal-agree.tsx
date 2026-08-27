"use client"

import Link from "next/link"

import { LEGAL_VERSION } from "@/lib/legal"
import { cn } from "@/lib/utils"

export function LegalAgree({
    checked,
    onCheckedChange,
    disabled,
    id = "legal-agree",
    hint,
}: {
    checked: boolean
    onCheckedChange: (next: boolean) => void
    disabled?: boolean
    id?: string
    hint?: string
}) {
    return (
        <label
            htmlFor={id}
            className={cn(
                "flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-3 text-sm transition-colors",
                checked
                    ? "border-border/70 bg-background/40 text-muted-foreground"
                    : "border-primary/40 bg-primary/5 text-foreground",
                disabled && "cursor-not-allowed opacity-60"
            )}
        >
            <input
                id={id}
                type="checkbox"
                required
                className="mt-0.5 size-4 shrink-0 rounded border-border accent-primary"
                checked={checked}
                disabled={disabled}
                onChange={(e) => {
                    const next = e.target.checked
                    onCheckedChange(next)
                    try {
                        if (next) {
                            sessionStorage.setItem(
                                "sw-legal-intent",
                                LEGAL_VERSION
                            )
                        } else {
                            sessionStorage.removeItem("sw-legal-intent")
                        }
                    } catch {
                        /* ignore */
                    }
                }}
            />
            <span className="space-y-1">
                <span className="block">
                    I agree to the{" "}
                    <Link
                        href="/terms"
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                        target="_blank"
                    >
                        Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                        href="/privacy"
                        className="font-medium text-foreground underline-offset-2 hover:underline"
                        target="_blank"
                    >
                        Privacy Policy
                    </Link>
                    .
                </span>
                {hint ? (
                    <span className="block text-xs text-muted-foreground">
                        {hint}
                    </span>
                ) : null}
            </span>
        </label>
    )
}
