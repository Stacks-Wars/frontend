import { headers } from "next/headers"

import { auth } from "@/lib/auth/server"

export async function getServerSession() {
    return auth.api.getSession({
        headers: await headers(),
    })
}
