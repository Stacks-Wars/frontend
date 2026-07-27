import { SignOutButton } from "@/components/auth/sign-out-button"
import { getCurrentUser } from "@/actions/users"

export const dynamic = "force-dynamic"

export default async function ProfilePage({
    params,
}: {
    params: Promise<{ id: string }>
}) {
    const { id } = await params
    const user = await getCurrentUser()

    return (
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
            <h1 className="font-display text-4xl tracking-tight">Profile</h1>
            <p className="mt-2 text-muted-foreground">
                Your arena identity. Personal payout wallet linking comes later.
            </p>

            <div className="mt-8 space-y-4 rounded-2xl border border-border/70 bg-card/70 p-6">
                <div>
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        Display name
                    </p>
                    <p className="mt-1 text-lg">
                        {user.displayName || "Unnamed warrior"}
                    </p>
                </div>
                <div>
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        Email
                    </p>
                    <p className="mt-1">{user.email}</p>
                </div>
                <div>
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        Rewards wallet
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {user.walletAddress ?? "Not linked yet"}
                    </p>
                </div>
                <div>
                    <p className="text-xs tracking-wide text-muted-foreground uppercase">
                        User id
                    </p>
                    <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {user.id}
                        {user.id !== id ? ` · viewing route ${id}` : null}
                    </p>
                </div>
                <SignOutButton />
            </div>
        </div>
    )
}
