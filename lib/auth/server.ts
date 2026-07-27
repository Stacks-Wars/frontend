import { createNeonAuth } from "@neondatabase/auth/next/server"

const cookieSecret = process.env.NEON_AUTH_COOKIE_SECRET

if (!cookieSecret || cookieSecret.length < 32) {
    throw new Error(
        "NEON_AUTH_COOKIE_SECRET must be set and at least 32 characters long."
    )
}

export const auth = createNeonAuth({
    baseUrl: process.env.NEON_AUTH_BASE_URL!,
    cookies: {
        secret: cookieSecret,
        sameSite: "lax",
    },
})
