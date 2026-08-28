import type { Metadata } from "next"

import { LegalDoc } from "@/components/legal/legal-doc"
import { LEGAL_CONTACT_EMAIL, LEGAL_TELEGRAM } from "@/lib/legal"

export const metadata: Metadata = {
    title: "Privacy Policy",
    description: "How Stacks Wars collects and uses account and match data.",
    alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
    return (
        <LegalDoc title="Privacy Policy" updated="28 August 2026">
            <section className="space-y-3">
                <h2>1. What we collect</h2>
                <ul>
                    <li>
                        Neon Auth identity (email, Google profile). Neon Auth is
                        a managed Better Auth service, stored separately from
                        app Postgres.
                    </li>
                    <li>Profile fields: username, display name, avatar URL.</li>
                    <li>
                        Custodial wallet addresses, public keys, and encrypted
                        mnemonic material per supported chain. Balance is read
                        from the network; we do not keep an internal ledger.
                    </li>
                    <li>
                        Match history, stats, lobby participation, Redis vault
                        drafts, and Web Push endpoints.
                    </li>
                    <li>
                        IP addresses and application logs for abuse control.
                    </li>
                </ul>
            </section>

            <section className="space-y-3">
                <h2>2. Why we use it</h2>
                <p>
                    To run accounts, matches, anti-abuse, payouts, and
                    notifications you enable. We do not sell personal data.
                </p>
            </section>

            <section className="space-y-3">
                <h2>3. Processors</h2>
                <p>
                    Neon (database and Auth), Google (OAuth if you use it), the
                    Stacks and Solana networks and their RPC providers, and
                    browser push services (Apple, Google, Mozilla, and similar).
                </p>
            </section>

            <section className="space-y-3">
                <h2>4. Retention and rights</h2>
                <p>
                    We keep account and match records while the account is
                    active. After deletion we scrub profile PII, drop push
                    subscriptions and wallet ciphertext, and keep anonymized
                    match rows so other players’ history still resolves.
                </p>
                <p>
                    You can access or delete your account from Settings, subject
                    to funds and active-match checks. Contact{" "}
                    <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
                        {LEGAL_CONTACT_EMAIL}
                    </a>{" "}
                    or{" "}
                    <a href={LEGAL_TELEGRAM} target="_blank" rel="noreferrer">
                        Telegram
                    </a>
                    .
                </p>
            </section>

            <section className="space-y-3">
                <h2>5. Cookies and local storage</h2>
                <p>
                    We use session cookies for sign-in, plus local storage for
                    sound preferences, install-prompt dismissal, and similar
                    client settings.
                </p>
            </section>

            <section className="space-y-3">
                <h2>6. Children</h2>
                <p>
                    The service is not for anyone under 18. We do not knowingly
                    collect data from children.
                </p>
            </section>
        </LegalDoc>
    )
}
