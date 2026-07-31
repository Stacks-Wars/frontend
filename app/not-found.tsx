import Link from "next/link"
import { RiCompass3Line } from "@remixicon/react"

import { Button } from "@/components/ui"

export default function NotFound() {
    return (
        <main className="grid min-h-svh place-items-center bg-grid px-4">
            <div className="max-w-md space-y-5 text-center">
                <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-border/70 text-muted-foreground surface-raised">
                    <RiCompass3Line />
                </span>
                <h1 className="font-display text-3xl">Nothing here</h1>
                <p className="text-muted-foreground">
                    That page does not exist. The lobby may have closed, or the
                    link is wrong.
                </p>
                <div className="flex justify-center gap-2">
                    <Button variant="primary" render={<Link href="/games" />}>
                        Browse games
                    </Button>
                    <Button variant="outline" render={<Link href="/" />}>
                        Home
                    </Button>
                </div>
            </div>
        </main>
    )
}
