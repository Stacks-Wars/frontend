import {
    RiGroupLine,
    RiShieldCheckLine,
    RiTrophyLine,
    RiWalletLine,
} from "@remixicon/react"

const STEPS = [
    {
        icon: RiWalletLine,
        title: "Fund the account",
        body: "On Stacks, send USDCx to the address on your wallet page. On Solana we mint you $50 test USDC. Free lobbies skip this.",
    },
    {
        icon: RiGroupLine,
        title: "Take a seat",
        body: "Join an open lobby or host your own. Entry moves into the vault when you sit down.",
    },
    {
        icon: RiShieldCheckLine,
        title: "Play it out",
        body: "The server runs the match. Leaving before the start refunds your entry in full.",
    },
    {
        icon: RiTrophyLine,
        title: "Collect",
        body: "The contract pays out when the match settles. Points land on the season board straight away.",
    },
]

export function HowItWorks() {
    return (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {STEPS.map((step, index) => (
                <div
                    key={step.title}
                    className="animate-rise-in space-y-3 rounded-2xl border border-border/70 p-5 stagger surface-raised"
                    style={{ "--index": index } as React.CSSProperties}
                >
                    <div className="flex items-center gap-2.5">
                        <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
                            <step.icon className="size-4" />
                        </span>
                        <span className="tnum text-xs text-muted-foreground">
                            0{index + 1}
                        </span>
                    </div>
                    <h3 className="font-medium">{step.title}</h3>
                    <p className="text-sm text-muted-foreground">{step.body}</p>
                </div>
            ))}
        </section>
    )
}
