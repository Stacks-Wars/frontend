export class AccountDeleteError extends Error {
    code: "funds_remaining" | "active_match" | "unknown"
    availableMicro: number
    pendingClaimMicro: number

    constructor(body: {
        code?: string
        error?: string
        availableMicro?: number
        pendingClaimMicro?: number
    }) {
        super(body.error ?? "Cannot delete account")
        this.name = "AccountDeleteError"
        this.code =
            body.code === "funds_remaining" || body.code === "active_match"
                ? body.code
                : "unknown"
        this.availableMicro = body.availableMicro ?? 0
        this.pendingClaimMicro = body.pendingClaimMicro ?? 0
    }
}

export type DeleteAccountResult =
    | { ok: true }
    | {
          ok: false
          code: "funds_remaining" | "active_match" | "unknown"
          availableMicro: number
          pendingClaimMicro: number
          error: string
      }
