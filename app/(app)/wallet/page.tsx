"use client"

import Link from "next/link"
import { RiWallet3Line } from "@remixicon/react"

import { PageContainer } from "@/components/common/page-container"
import { PageHeader, SectionHeader } from "@/components/common/section"
import { BalanceCard } from "@/components/wallet/balance-card"
import { DepositPanel } from "@/components/wallet/deposit-panel"
import { PendingWins } from "@/components/wallet/pending-wins"
import { TransactionList } from "@/components/wallet/transaction-list"
import { WithdrawForm } from "@/components/wallet/withdraw-form"
import { Button, EmptyState, Skeleton } from "@/components/ui"
import { useSessionStore } from "@/stores/session"

export default function WalletPage() {
    const user = useSessionStore((s) => s.user)
    const loading = useSessionStore((s) => s.loading)

    return (
        <PageContainer size="default" className="space-y-8">
            <PageHeader
                title="Wallet"
                description="Your custodial USDCx balance on Stacks, with every on-chain movement it makes."
            />

            {!user ? (
                loading ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <Skeleton className="h-44 rounded-2xl" />
                        <Skeleton className="h-44 rounded-2xl" />
                    </div>
                ) : (
                    <EmptyState
                        icon={<RiWallet3Line />}
                        title="Sign in to see your wallet"
                        description="Balances, deposits, and withdrawals belong to your player account."
                        action={
                            <Button
                                variant="primary"
                                render={<Link href="/auth/login" />}
                            >
                                Sign in
                            </Button>
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
                            description="Sends USDCx from your custodial wallet to a Stacks address."
                        />
                        <div className="lg:max-w-xl">
                            <WithdrawForm />
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
