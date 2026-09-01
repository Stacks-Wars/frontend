"use client"

import { RiWallet3Line } from "@remixicon/react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader, SectionHeader } from "@/components/common/section"
import { BalanceCard } from "@/components/wallet/balance-card"
import { DepositPanel } from "@/components/wallet/deposit-panel"
import { PendingWins } from "@/components/wallet/pending-wins"
import { TransactionList } from "@/components/wallet/transaction-list"
import { WithdrawForm } from "@/components/wallet/withdraw-form"
import { WalletPageSkeleton } from "@/components/common/list-skeleton"
import { ButtonLink, EmptyState } from "@/components/ui"
import { chainAdapter } from "@/lib/chain"
import {
    useSessionCurrentChain,
    useSessionLoading,
    useSessionUser,
} from "@/stores/session"

export default function WalletPage() {
    const user = useSessionUser()
    const loading = useSessionLoading()
    const chain = useSessionCurrentChain()
    const token = chainAdapter(chain).playToken

    return (
        <PageContainer size="default" className="space-y-8">
            <PageHeader title="Wallet" />

            {!user ? (
                loading ? (
                    <WalletPageSkeleton header={false} />
                ) : (
                    <EmptyState
                        icon={<RiWallet3Line />}
                        title="Sign in to see your wallet"
                        description="Balances, deposits, and withdrawals belong to your player account."
                        action={
                            <ButtonLink href="/auth/login" variant="primary">
                                Sign in
                            </ButtonLink>
                        }
                    />
                )
            ) : (
                <div className="space-y-10">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <section className="animate-rise-in space-y-4">
                            <SectionHeader title="Balance" />
                            <BalanceCard />
                        </section>

                        <section className="animate-rise-in space-y-4">
                            <SectionHeader title="Add funds" />
                            <DepositPanel />
                        </section>
                    </div>

                    <section className="animate-rise-in space-y-4">
                        <SectionHeader
                            title="Withdraw"
                            description={`Sends ${token} from your custodial wallet to a ${chainAdapter(chain).label} address you control.`}
                        />
                        <div className="lg:max-w-xl">
                            <WithdrawForm key={chain} />
                        </div>
                    </section>

                    <section className="animate-rise-in space-y-4">
                        <SectionHeader
                            title="Pending wins"
                            description="Claim match rewards here if a claim was interrupted."
                        />
                        <PendingWins />
                    </section>

                    <section className="animate-rise-in space-y-4">
                        <SectionHeader
                            title="Transactions"
                            description="Deposits, lobby entries, refunds, and winnings."
                        />
                        <TransactionList />
                    </section>
                </div>
            )}
        </PageContainer>
    )
}
