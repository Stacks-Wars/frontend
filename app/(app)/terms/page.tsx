import type { Metadata } from "next"

import { LegalDoc } from "@/components/legal/legal-doc"
import {
    LEGAL_CONTACT_EMAIL,
    LEGAL_SITE,
    LEGAL_TELEGRAM,
    LEGAL_VERSION,
} from "@/lib/legal"

export const metadata: Metadata = {
    title: "Terms of Service",
    description: "Terms for using Stacks Wars, a skill-based USDC arena.",
}

export default function TermsPage() {
    return (
        <LegalDoc title="Terms of Service" updated="21 August 2026">
            <section className="space-y-3">
                <h2>1. Who we are</h2>
                <p>
                    These terms govern your use of Stacks Wars at{" "}
                    <a href={LEGAL_SITE}>{LEGAL_SITE}</a> (the “service”).
                    Contact:{" "}
                    <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
                        {LEGAL_CONTACT_EMAIL}
                    </a>
                    . Telegram:{" "}
                    <a href={LEGAL_TELEGRAM} target="_blank" rel="noreferrer">
                        t.me/stackswars
                    </a>
                    .
                </p>
                <p>
                    Creating an account is agreement to these terms and the
                    Privacy Policy (version {LEGAL_VERSION}). Public browsing
                    without an account is allowed.
                </p>
            </section>

            <section className="space-y-3">
                <h2>2. Eligibility</h2>
                <ul>
                    <li>You must be at least 18 years old.</li>
                    <li>
                        You must be allowed to use cryptocurrency and
                        skill-based contests where you live. Geo-restriction is
                        your responsibility; we may block regions.
                    </li>
                    <li>
                        We are not a bank, broker, or investment adviser. USDCx
                        on Stacks is not a deposit. Nothing here is investment
                        advice.
                    </li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2>3. Skill-based matches</h2>
                <p>
                    Lobbies are skill-based multiplayer matches. A paid entry is
                    a stake in that match, held in the on-chain vault until
                    settlement. Platform and game developer fees are taken as
                    described in the product and vault contract.
                </p>
                <p>
                    Winnings are not guaranteed. Cheating, multi-accounting, or
                    exploiting the client or contracts may result in forfeit,
                    ban, and withheld claims.
                </p>
            </section>

            <section className="space-y-3">
                <h2>4. Custodial wallet and vault</h2>
                <p>
                    We provision a custodial Stacks wallet for you. Private keys
                    / mnemonic material are encrypted (KMS). You authorize
                    deposits, withdrawals, match entries, and claim transactions
                    by using those flows in the app.
                </p>
                <p>
                    On-chain transactions are irreversible. Network congestion,
                    contract bugs, and chain reorgs are risks you accept. We
                    cannot unwind a confirmed transaction.
                </p>
            </section>

            <section className="space-y-3">
                <h2>5. Account deletion and remaining funds</h2>
                <p>
                    You may request deletion in Settings. We will refuse while
                    you have a spendable balance, unclaimed vault winnings, or
                    an active match. After deletion we anonymize your profile
                    and delete encrypted keys. On-chain USDCx that was not
                    withdrawn stays on chain; we do not sweep it.
                </p>
            </section>

            <section className="space-y-3">
                <h2>6. “As is” and liability</h2>
                <p>
                    The service is provided as is. To the fullest extent allowed
                    by law we are not liable for lost funds, lost profits,
                    downtime, or third-party (Stacks, Neon, Google, push
                    networks) failures. Governing law placeholder: to be set by
                    counsel for the operating entity.
                </p>
            </section>
        </LegalDoc>
    )
}
