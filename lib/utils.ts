import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export function truncateWallet(wallet: string) {
    if (wallet.length <= 12) {
        return wallet
    }

    return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`
}
