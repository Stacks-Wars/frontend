import type { ReactNode } from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
    title: "Wallet",
    robots: { index: false, follow: false },
}

export default function WalletLayout({ children }: { children: ReactNode }) {
    return children
}
