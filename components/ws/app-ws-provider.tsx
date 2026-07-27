"use client"

import * as React from "react"

import { appSocket } from "@/lib/ws/app-socket"

/** Opens the multiplexed `/app` socket once for the app shell lifetime. */
export function AppWsProvider() {
    React.useEffect(() => {
        appSocket.connect()
        return () => {
            appSocket.disconnect()
        }
    }, [])

    return null
}
