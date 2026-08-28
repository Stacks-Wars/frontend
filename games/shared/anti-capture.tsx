"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

function blockCapture(event: React.SyntheticEvent) {
    event.preventDefault()
}

export function AntiCapture({
    children,
    className,
}: {
    children: React.ReactNode
    className?: string
}) {
    const [obscured, setObscured] = React.useState(false)

    React.useEffect(() => {
        let reset: number | undefined

        const onKeyDown = (event: KeyboardEvent) => {
            const isMac = navigator.userAgent.includes("Mac")
            const cmd = isMac ? event.metaKey : event.ctrlKey

            // Block all common screenshot shortcuts
            const isScreenshotShortcut =
                event.key === "PrintScreen" ||
                (event.altKey && event.key === "PrintScreen") ||
                (event.key === "PrintScreen" &&
                    (event.metaKey || event.ctrlKey)) ||
                (isMac && cmd && ["3", "4", "5"].includes(event.key)) ||
                (isMac &&
                    cmd &&
                    event.ctrlKey &&
                    ["3", "4"].includes(event.key)) ||
                (!isMac && cmd && event.key === "p") // Ctrl+P (print dialog)

            if (isScreenshotShortcut) {
                event.preventDefault()
                event.stopPropagation()
                setObscured(true)
                window.clearTimeout(reset)
                reset = window.setTimeout(() => setObscured(false), 1200)
                return false
            }
        }

        // Also block the print dialog
        const onPrint = (event: BeforeUnloadEvent) => {
            event.preventDefault()
            setObscured(true)
            setTimeout(() => setObscured(false), 1200)
        }

        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("beforeprint", onPrint)

        return () => {
            window.removeEventListener("keydown", onKeyDown)
            window.removeEventListener("beforeprint", onPrint)
            window.clearTimeout(reset)
        }
    }, [])

    return (
        <div
            className={cn(
                "relative select-none [-webkit-touch-callout:none] **:select-none print:hidden",
                obscured && "pointer-events-none blur-md",
                className
            )}
            translate="no"
            draggable={false}
            onCopy={blockCapture}
            onCut={blockCapture}
            onPaste={blockCapture}
            onContextMenu={blockCapture}
            onDragStart={blockCapture}
        >
            {children}
        </div>
    )
}
