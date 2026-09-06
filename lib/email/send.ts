import { Resend } from "resend"

const FROM = "Stacks Wars <noreply@mail.stackswars.com>"

function resend() {
    const key = process.env.RESEND_API_KEY?.trim()
    if (!key) {
        throw new Error("RESEND_API_KEY is not set.")
    }
    return new Resend(key)
}

export async function sendAuthEmail(input: {
    to: string
    subject: string
    text: string
    html?: string
}) {
    const { data, error } = await resend().emails.send({
        from: FROM,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html ?? `<p>${input.text.replaceAll("\n", "<br/>")}</p>`,
    })
    if (error) {
        throw new Error(error.message)
    }
    return data
}
