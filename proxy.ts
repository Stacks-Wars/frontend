import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

import { auth } from "@/lib/auth/server"

const NEON_AUTH_SESSION_VERIFIER_PARAM = "neon_auth_session_verifier"
const NEON_AUTH_COOKIE_PREFIX = "__Secure-neon-auth"

const authProxy = auth.middleware({
    loginUrl: "/auth/login",
})

const protectedPrefixes = ["/u"]

function isProtectedPath(pathname: string) {
    return protectedPrefixes.some((prefix) => pathname.startsWith(prefix))
}

function hasOAuthSessionVerifier(request: NextRequest) {
    return request.nextUrl.searchParams.has(NEON_AUTH_SESSION_VERIFIER_PARAM)
}

function hasNeonAuthCookies(request: NextRequest) {
    return request.cookies
        .getAll()
        .some((cookie) => cookie.name.startsWith(NEON_AUTH_COOKIE_PREFIX))
}

export default async function proxy(request: NextRequest) {
    if (request.headers.has("next-action")) {
        return NextResponse.next()
    }

    const { pathname } = request.nextUrl
    const isHomeSessionRefresh = pathname === "/" && hasNeonAuthCookies(request)

    if (
        hasOAuthSessionVerifier(request) ||
        isProtectedPath(pathname) ||
        isHomeSessionRefresh
    ) {
        const response = await authProxy(request)

        if (
            isHomeSessionRefresh &&
            !hasOAuthSessionVerifier(request) &&
            response.headers.get("location")?.includes("/auth/login")
        ) {
            return NextResponse.next()
        }

        return response
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        "/",
        "/u",
        "/u/:path*",
        {
            source: "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
            has: [
                {
                    type: "query",
                    key: "neon_auth_session_verifier",
                },
            ],
        },
    ],
}
