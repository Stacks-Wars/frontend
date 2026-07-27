# Stacks Wars Frontend

Next.js shell for the reimplemented Stacks Wars arena UI, Neon Auth, and app-user sync against the Rust backend.

## Stack

- Next.js 16 / React 19 / Tailwind CSS v4
- Neon Auth (`@neondatabase/auth`) — same flow as Chill Flow
- Custodial Stacks wallets via `@stacks/wallet-sdk` + KMS (or local AES for dev)
- Posts synced users to the Rust API (`POST /users`)

## Develop

```bash
cp env.example .env.local
bun install
bun run dev
```

Requires the backend on `NEXT_PUBLIC_API_URL` (default `http://127.0.0.1:8080`) with a matching `INTERNAL_API_SECRET`.
