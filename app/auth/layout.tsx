import Link from "next/link"

export default function AuthLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <div className="min-h-svh bg-[radial-gradient(circle_at_top,rgba(44,97,184,0.22),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(242,156,17,0.12),transparent_30%)]">
            <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 sm:px-6">
                <Link
                    href="/"
                    className="font-display text-xl tracking-tight hover:text-secondary"
                >
                    Stacks Wars
                </Link>
            </div>
            {children}
        </div>
    )
}
