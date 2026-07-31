# AGENT.md — Stacks Wars Frontend

Canonical docs: https://docs.stackswars.com/

Do not invent architecture. Prefer docs + existing patterns in this repo.

## Scope

- App root: this `frontend/` package (Bun + Next.js).
- Games UI: `games/{gameId}/` registered via `games/boot.ts` + `games/registry.ts`.
- Keep `PLAYABLE_GAME_IDS` in sync with `boot.ts` imports.

## Architecture rules

1. **WebSocket-first** — lobby/room/presence updates flow through the multiplexed `/app` socket. Do not poll for state the socket already pushes.
2. **Server actions / API** — mutations that need secrets, Hiro, vault, or auth stay in `actions/` or Route Handlers; clients stay thin.
3. **No duplicated domain logic** — amounts, vault helpers, and formatters live in `lib/` (e.g. `lib/vault`, `lib/format`). Reuse them.
4. **Game isolation** — game-specific React stays under `games/{id}/`. Shared room chrome stays in `components/room/`.
5. **Registry only on the client** — `registerGame` is UI wiring; catalog metadata comes from the Rust API.

## Routing

- App shell: `app/(app)/…`
- Auth: `app/auth/`
- Profiles: `/profile/[username]`
- Prefer existing route groups; do not add parallel page trees for the same feature.

## UI

- Reuse `@/components/ui` and existing feature components.
- Match current visual language; do not introduce a second design system.
- Self-only controls (e.g. profile **Get ID**) must gate on session user id vs profile id so other visitors stay uncluttered.

## Realtime

- Use existing hooks/stores for connection status and room channels.
- After reconnect, rely on snapshot/resync paths already used by rooms — do not bespoke a second protocol.

## Games

- `gameId` must match backend `GameId` exactly.
- Required: `Room`. Optional: `LobbyPanel`, `Page`, `createActions`, `onMatchFinished`.
- Read https://docs.stackswars.com/develop/registration before adding a game.

## Don’t

- Use browser wallet extensions for play funds (custodial USDCx only).
- Commit secrets (mnemonics, KMS keys, cookie secrets).
