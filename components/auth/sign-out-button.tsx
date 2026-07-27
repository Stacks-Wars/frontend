"use client"

import { useRouter } from "next/navigation"
import { RiLogoutBoxRLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { authClient } from "@/lib/auth/client"
import { useUserStore } from "@/store/user"

export function SignOutButton() {
    const router = useRouter()
    const setUser = useUserStore((state) => state.setUser)

    async function handleSignOut() {
        try {
            const { disconnect } = await import("@stacks/connect")
            disconnect()
        } catch {
            // Wallet may not be connected in this session.
        }

        await authClient.signOut()
        setUser(null)
        router.push("/auth/login")
        router.refresh()
    }

    return (
        <Button
            variant="outline"
            className="w-fit justify-between"
            onClick={() => void handleSignOut()}
        >
            Sign out
            <RiLogoutBoxRLine className="size-4" />
        </Button>
    )
}
