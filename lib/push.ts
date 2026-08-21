import {
    removeUserPushSubscription,
    saveUserPushSubscription,
} from "@/actions/users"

function urlBase64ToUint8Array(base64: string) {
    const padding = "=".repeat((4 - (base64.length % 4)) % 4)
    const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"))
    const output = new Uint8Array(raw.length)
    for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i)
    return output
}

export function isIosDevice() {
    if (typeof navigator === "undefined") return false
    const ua = navigator.userAgent
    if (/iPad|iPhone|iPod/.test(ua)) return !("MSStream" in window)
    return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1
}

export function isStandaloneDisplay() {
    if (typeof window === "undefined") return false
    return (
        window.matchMedia("(display-mode: standalone)").matches ||
        Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
    )
}

/** True when this browser can subscribe to Web Push (desktop, Android, installed iOS PWA). */
export function isWebPushSupported() {
    if (typeof window === "undefined") return false
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()) return false
    if (
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
    ) {
        return false
    }
    if (isIosDevice() && !isStandaloneDisplay()) return false
    return true
}

export async function currentPushSubscription(): Promise<PushSubscription | null> {
    if (!isWebPushSupported()) return null
    const reg = await navigator.serviceWorker.ready
    return reg.pushManager.getSubscription()
}

export async function subscribeWebPush(): Promise<boolean> {
    if (!isWebPushSupported()) return false
    const key = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim()
    if (!key) return false

    let permission = Notification.permission
    if (permission === "default") {
        try {
            permission = await Notification.requestPermission()
        } catch {
            return false
        }
    }
    if (permission !== "granted") return false

    const reg = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
    })
    let sub = await reg.pushManager.getSubscription()
    if (!sub) {
        sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(key),
        })
    }
    const json = sub.toJSON()
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) return false
    await saveUserPushSubscription({
        endpoint: json.endpoint,
        keys: { p256dh: json.keys.p256dh, auth: json.keys.auth },
        userAgent: navigator.userAgent,
    })
    return true
}

export async function unsubscribeWebPush(): Promise<void> {
    const sub = await currentPushSubscription()
    if (!sub) return
    await removeUserPushSubscription(sub.endpoint).catch(() => undefined)
    await sub.unsubscribe().catch(() => undefined)
}
