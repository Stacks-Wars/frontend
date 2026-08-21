import { GameRegistryBoot } from "@/components/games/game-registry-boot"
import { CreateLobbyProvider } from "@/components/lobbies/create-lobby-provider"
import { InstallPrompt } from "@/components/pwa/install-prompt"
import { PushPrompt } from "@/components/pwa/push-prompt"
import { AppFooter } from "@/components/shell/app-footer"
import { AppHeader } from "@/components/shell/app-header"
import { AddFundsProvider } from "@/components/wallet/add-funds-provider"

export default function AppLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <CreateLobbyProvider>
            <AddFundsProvider>
                <div className="flex min-h-svh flex-col">
                    <GameRegistryBoot />
                    <AppHeader />
                    <main className="flex-1">{children}</main>
                    <AppFooter />
                    <InstallPrompt />
                    <PushPrompt />
                </div>
            </AddFundsProvider>
        </CreateLobbyProvider>
    )
}
