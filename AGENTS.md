<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Frontend

App root is this `frontend/` package (Bun + Next.js). Canonical docs: https://docs.stackswars.com/

Do not invent architecture. Match what is already here, then the rules below.

Games UI lives in `games/{gameId}/` and registers through `games/boot.ts` + `games/registry.ts`. Keep `PLAYABLE_GAME_IDS` in sync with `boot.ts` imports.

## Architecture

1. WebSocket first. Lobby, room, presence, activity, and balance updates arrive on the multiplexed `/app` socket. Do not poll for state the socket already pushes. HTTP is for the first paint, pagination, and mutations that need secrets.
2. Mutations that need secrets, Hiro, vault, or auth stay in `actions/` or Route Handlers. Client components stay thin.
3. Amounts, vault helpers, and formatters live in `lib/`. Do not copy them into components.
4. Game-specific React stays under `games/{id}/`. Shared room chrome stays in `components/room/`.
5. `registerGame` is client UI wiring. Catalog metadata comes from the Rust API.

## Zustand

Client app state goes through Zustand. Pattern is the one in chill-flow `store/createFlow.ts`: data fields on the store, all setters nested under a stable `actions` object, and components subscribe with atomic selectors.

```ts
type SessionState = {
    user: AppUser | null
    loading: boolean
    actions: {
        setUser: (user: AppUser | null) => void
        setLoading: (loading: boolean) => void
    }
}

export const useSessionUser = () => useSessionStore((s) => s.user)
export const useSessionActions = () => useSessionStore((s) => s.actions)
```

Rules:

- Never call `useStore()` without a selector.
- Never select the whole store, a whole `Record`, or `{ user, balance }` as one object. Pick the field the component actually reads.
- Subscribe to `actions` (or a named `useXActions` hook), not to individual setters mixed with data. The `actions` object is created once and must not be replaced.
- `getState()` is the right way to write from socket handlers, timeouts, and non-React code. Do not subscribe a provider to data it only forwards.
- Persist only what must survive a reload (sound, install/push dismiss). Session, rooms, and feeds are live data; do not persist them.

What belongs in a store: session user, balance, live lobbies/rooms/activity, notifications, sound, push, connection status, and any dialog that more than one route opens (create lobby, add funds).

What does not: a single form's text fields (use RHF), one-shot busy flags, animation, OTP digits, a filter that dies when you leave the page.

React Query is for paginated HTTP (leaderboard pages, tx history) and for seeding a store once. After the socket owns a value, stop refetching it. Invalidating `["balance"]` after `wallet.balance.updated` is a bug if the session store already took the patch.

## Renders

`AppWsProvider` must not hold React state that changes on every socket event. Status belongs in a store. Message handling already uses `getState()`; keep it that way.

A header widget that only needs `user.id` must not also subscribe to `balance`. A room view must select `rooms[lobbyId]`, not `rooms`.

If a parent re-renders because of store noise, split the subscriber down into a child.

## Copy

UI strings should sound like a person talking, not a landing page. Short sentences. Concrete verbs. No "seamless", "unlock", "elevate", "competitive arena", or stacked em dashes in errors. Do not repeat "skill-based" as filler. Hero copy on the landing page is the bar: "Put something on the line."

## Routing and UI

- App shell: `app/(app)/`
- Auth: `app/auth/`
- Profiles: `/profile/[username]`
- Reuse `@/components/ui`. Do not add a second design system.
- Self-only controls gate on session user id vs the page's user id.

## Games

`gameId` must match backend `GameId` exactly. Required: `Room`. Optional: `LobbyPanel`, `Page`, `createActions`, `onMatchFinished`. Read https://docs.stackswars.com/develop/registration before adding a game.

After reconnect, use the existing snapshot/resync path. Do not invent a second protocol.

## Chain

Stacks is the current chain, not a type name we should freeze. Domain fields like `stxAddress` are chain-specific; new code should treat address, vault, and explorer URLs as adapters behind `lib/`, not sprinkle `Stacks` through components. Do not add a second wallet path (browser extensions) for play funds. Custodial USDCx only, until a chain adapter exists.

## Don't

- Poll for socket-owned state.
- Commit secrets (mnemonics, KMS keys, cookie secrets).
- Put game React outside `games/{id}/`.
