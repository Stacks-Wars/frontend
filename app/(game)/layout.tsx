import { Footer } from "@/components/layout/footer"
import { Header } from "@/components/layout/header"

export default function GameLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <div className="flex min-h-svh flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
        </div>
    )
}
