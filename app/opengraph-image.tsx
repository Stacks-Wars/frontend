import { readFile } from "node:fs/promises"
import { join } from "node:path"

import { ImageResponse } from "next/og"

import { APP_BACKGROUND, APP_FOREGROUND, APP_PRIMARY } from "@/lib/theme"

export const alt = "Stacks Wars"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default async function OpenGraphImage() {
    const logo = await readFile(join(process.cwd(), "public/logo.png"))
    const src = `data:image/png;base64,${logo.toString("base64")}`

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: 80,
                    backgroundColor: APP_BACKGROUND,
                    color: APP_FOREGROUND,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 28,
                    }}
                >
                    <img
                        src={src}
                        width={96}
                        height={96}
                        alt=""
                        style={{ borderRadius: 20 }}
                    />
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <div
                            style={{
                                fontSize: 64,
                                fontWeight: 700,
                                letterSpacing: -1.5,
                            }}
                        >
                            Stacks Wars
                        </div>
                        <div
                            style={{
                                marginTop: 8,
                                fontSize: 28,
                                color: "rgba(244,245,248,0.65)",
                            }}
                        >
                            Skill-based multiplayer on Stacks
                        </div>
                    </div>
                </div>
                <div
                    style={{
                        marginTop: 48,
                        height: 4,
                        width: 160,
                        backgroundColor: APP_PRIMARY,
                        borderRadius: 4,
                    }}
                />
            </div>
        ),
        { ...size }
    )
}
