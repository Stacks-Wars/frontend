/**
 * Local-dev escape hatch. When enabled, signup skips the email OTP step and
 * disposable-email (fakeout) checks so you can enter the app immediately.
 *
 * Exposed to the client via `next.config.ts` `env` mapping.
 */
import { isDev } from "@/lib/config"

export function isVerificationDisabled(): boolean {
    const raw = process.env.DISABLE_VERIFICATION?.trim().toLowerCase()
    if (raw === "0" || raw === "false" || raw === "no") return false
    if (raw === "1" || raw === "true" || raw === "yes") return true
    return isDev()
}

/** Better Auth may surface verification as boolean, ISO string, or Date. */
export function isEmailVerified(
    value: boolean | string | Date | null | undefined
): boolean {
    if (value === true) return true
    if (typeof value === "string" && value.trim().length > 0) return true
    if (value instanceof Date && !Number.isNaN(value.getTime())) return true
    return false
}
