import { isDisposableEmail } from "fakeout"
import { z } from "zod"

import { isVerificationDisabled } from "@/lib/auth/flags"

const emailField = z
    .string()
    .trim()
    .email("Enter a valid email address.")
    .refine(
        (email) => isVerificationDisabled() || !isDisposableEmail(email),
        "Disposable email addresses are not allowed."
    )

export const signInSchema = z.object({
    email: z.string().trim().email("Enter a valid email address."),
    password: z.string().min(1, "Password is required."),
})

export const signUpSchema = z.object({
    name: z.string().trim().min(2, "Name must be at least 2 characters."),
    email: emailField,
    password: z.string().min(8, "Password must be at least 8 characters long."),
})

export const verifyEmailOtpSchema = z.object({
    otp: z
        .string()
        .trim()
        .regex(/^\d{6}$/, "Enter the 6-digit code from your email."),
})

export type SignInFormValues = z.infer<typeof signInSchema>
export type SignUpFormValues = z.infer<typeof signUpSchema>
export type VerifyEmailOtpFormValues = z.infer<typeof verifyEmailOtpSchema>
