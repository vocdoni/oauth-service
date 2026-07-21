# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this service does

OAuth deterministic wallet generation service. A user authenticates via an OAuth provider (GitHub, Google, Facebook), and the service derives a deterministic seed from `hash(JSON.stringify(session.user) + NEXT_AUTH_SEED)`. That seed is used elsewhere (Vocdoni SDK / SaaS) to generate an Ethereum wallet for the user — same identity always produces the same wallet.

The app is meant to be opened in a popup window: after the user confirms login, it `postMessage`s the result back to `window.opener` and closes itself (see `src/pages/index.tsx`).

## Commands

- `yarn dev` — start dev server on port 8082
- `yarn build` — production build
- `yarn start` — start production server, `-p ${PORT:-8080}`, bound to `0.0.0.0`
- `yarn lint` — `next lint`

No test suite exists in this repo.

## Environment variables

Required (see `.env.example`): `GITHUB_ID`, `GITHUB_SECRET`, `FACEBOOK_ID`, `FACEBOOK_SECRET`, `NEXT_AUTH_SEED`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`. Google auth also needs `GOOGLE_ID`/`GOOGLE_SECRET` (used in `[...nextauth].ts` but not currently listed in `.env.example` — keep both in sync if you add/remove providers).

`NEXT_AUTH_SEED` is the master secret: it seeds both the per-user wallet derivation and the fixed service wallet (`getAddress.ts`). Treat it like a private key.

## Architecture

Next.js 13 Pages Router (not App Router) app, TypeScript, no App-level component library — plain CSS in `src/styles/globals.css`.

- `src/pages/api/auth/[...nextauth].ts` — NextAuth config (`authOptions`), exported so other API routes can call `getServerSession(req, res, authOptions)`. The `jwt`/`session` callbacks stash `account.provider` onto the token/session so downstream code knows which OAuth provider was used.
- `src/pages/api/auth/getWalletSeedFromSession.ts` — reads the current session, computes the deterministic seed. Has provider-specific behavior: for Google logins it additionally signs the user's email with a wallet derived from `NEXT_AUTH_SEED`, to support the "saas oauth protocol" (a signed-email proof of ownership consumed by another Vocdoni service). Other providers skip this step.
- `src/pages/api/info/getAddress.ts` — returns the address of the single deterministic wallet derived directly from `NEXT_AUTH_SEED` (not per-user — this is the service's own signing wallet address).
- `src/pages/index.tsx` — the only UI page. Drives sign-in via a `?provider=` query param, force-switches providers by signing out and redirecting if the session's provider doesn't match the requested one, and on "Continue" fetches the seed and posts it back to the opener window.

When adding a new OAuth provider: register it in `authOptions.providers`, add its env vars to `.env.example`, and confirm whether it needs the same Google-style email-signing branch in `getWalletSeedFromSession.ts` (currently gated on `session.user.provider == "google"`).
