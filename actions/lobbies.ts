"use server"

import { syncAuthUser } from "@/actions/users"
import { createLobby as createLobbyApi } from "@/lib/api/server"
import type { CreateLobbyPayload, LobbyDetail } from "@/lib/api/types"
import { auth } from "@/lib/auth/server"

export async function createFreeLobby(input: {
    name: string
    description?: string
    gameId: string
    isPrivate?: boolean
}): Promise<LobbyDetail> {
    const { data: session } = await auth.getSession()
    if (!session?.user?.email) {
        throw new Error("You must be signed in to create a lobby.")
    }

    const user = await syncAuthUser(session.user)
    const payload: CreateLobbyPayload = {
        name: input.name,
        description: input.description ?? null,
        gameId: input.gameId,
        creatorId: user.id,
        isPrivate: input.isPrivate ?? false,
    }
    return createLobbyApi(payload)
}
