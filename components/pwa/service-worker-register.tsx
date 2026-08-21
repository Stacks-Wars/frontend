"use client"

import * as React from "react"

export function ServiceWorkerRegister() {
    React.useEffect(() => {
        if (!("serviceWorker" in navigator)) return
        void navigator.serviceWorker
            .register("/sw.js", { scope: "/", updateViaCache: "none" })
            .catch(() => {
                /* unsupported / blocked */
            })
    }, [])

    return null
}
