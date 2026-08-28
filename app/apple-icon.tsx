import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { APP_BACKGROUND } from "@/lib/theme"

export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default async function AppleIcon() {
    const logo = await readFile(join(process.cwd(), "public/logo.png"))
    const src = `data:image/png;base64,${logo.toString("base64")}`

    return new ImageResponse(
        <div
            style={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: APP_BACKGROUND,
            }}
        >
            <img src={src} width={112} height={112} alt="" />
        </div>,
        { ...size }
    )
}
