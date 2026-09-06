import { betterAuth } from "better-auth"
import { nextCookies } from "better-auth/next-js"
import { emailOTP, jwt } from "better-auth/plugins"
import { after } from "next/server"
import { Pool } from "pg"

import { sendAuthEmail } from "@/lib/email/send"
import { isVerificationDisabled } from "@/lib/auth/flags"
import {
    appUrl,
    env,
    isDev,
    LOCAL_BETTER_AUTH_SECRET,
    LOCAL_DATABASE_URL,
} from "@/lib/config"

const databaseUrl = env("DATABASE_URL", LOCAL_DATABASE_URL)
const authSecret = env("BETTER_AUTH_SECRET", LOCAL_BETTER_AUTH_SECRET)
const authUrl = appUrl()
process.env.BETTER_AUTH_SECRET = authSecret
process.env.BETTER_AUTH_URL = authUrl

const skipVerification = isVerificationDisabled()

function queueEmail(task: () => Promise<unknown>) {
    after(() => {
        void task().catch((error) => {
            console.error("Failed to send auth email", error)
        })
    })
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim()
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()

export const auth = betterAuth({
    appName: "Stacks Wars",
    secret: authSecret || undefined,
    baseURL: authUrl || undefined,
    database: new Pool({ connectionString: databaseUrl }),
    trustedOrigins: [
        "http://localhost:3000",
        "https://www.stackswars.com",
        "https://stackswars.com",
        ...(authUrl ? [authUrl] : []),
        ...(appUrl() ? [appUrl()] : []),
    ],
    advanced: {
        database: {
            generateId: () => crypto.randomUUID(),
        },
        useSecureCookies: process.env.NODE_ENV === "production",
    },
    user: {
        modelName: "users",
        fields: {
            name: "display_name",
            emailVerified: "email_verified",
            image: "avatar_url",
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
    session: {
        modelName: "sessions",
        fields: {
            expiresAt: "expires_at",
            ipAddress: "ip_address",
            userAgent: "user_agent",
            userId: "user_id",
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
    account: {
        modelName: "accounts",
        fields: {
            accountId: "account_id",
            providerId: "provider_id",
            userId: "user_id",
            accessToken: "access_token",
            refreshToken: "refresh_token",
            idToken: "id_token",
            accessTokenExpiresAt: "access_token_expires_at",
            refreshTokenExpiresAt: "refresh_token_expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
        accountLinking: {
            enabled: true,
            trustedProviders: ["google"],
        },
    },
    verification: {
        modelName: "verifications",
        fields: {
            expiresAt: "expires_at",
            createdAt: "created_at",
            updatedAt: "updated_at",
        },
    },
    databaseHooks: {
        user: {
            create: {
                before: async (user) => {
                    const name =
                        user.name?.trim() || user.email.split("@")[0] || "Player"
                    return { data: { ...user, name } }
                },
            },
        },
    },
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        requireEmailVerification: !skipVerification,
        sendResetPassword: async ({ user, url }) => {
            queueEmail(() =>
                sendAuthEmail({
                    to: user.email,
                    subject: "Reset your Stacks Wars password",
                    text: `Reset your password:\n${url}\n\nThis link expires soon. If you did not ask for it, ignore this email.`,
                })
            )
        },
    },
    emailVerification: {
        sendOnSignUp: !skipVerification,
        sendOnSignIn: !skipVerification,
    },
    socialProviders: {
        ...(googleClientId && googleClientSecret
            ? {
                  google: {
                      clientId: googleClientId,
                      clientSecret: googleClientSecret,
                  },
              }
            : {}),
    },
    plugins: [
        emailOTP({
            overrideDefaultEmailVerification: true,
            sendVerificationOnSignUp: !skipVerification,
            async sendVerificationOTP({ email, otp, type }) {
                const subject =
                    type === "forget-password"
                        ? "Your Stacks Wars reset code"
                        : "Verify your Stacks Wars email"
                const text =
                    type === "forget-password"
                        ? `Your password reset code is ${otp}. It expires in 5 minutes.`
                        : `Your verification code is ${otp}. It expires in 5 minutes.`
                queueEmail(() => sendAuthEmail({ to: email, subject, text }))
            },
        }),
        jwt({
            schema: {
                jwks: {
                    fields: {
                        publicKey: "public_key",
                        privateKey: "private_key",
                        createdAt: "created_at",
                        expiresAt: "expires_at",
                    },
                },
            },
            jwks: {
                disablePrivateKeyEncryption: isDev(),
            },
            jwt: {
                definePayload: ({ user }) => ({
                    email: user.email,
                    emailVerified: user.emailVerified,
                }),
            },
        }),
        nextCookies(),
    ],
})

export type Session = typeof auth.$Infer.Session
