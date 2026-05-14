# Shyraq SuperAdmin Frontend

Internal web tool for the Shyraq team to manage the SaaS kindergarten platform: tenants, subscriptions, feature flags, operator triggers (crons), DLQ. Desktop-first, behind VPN/IP-allowlist. Not to be confused with Admin Web (per-kindergarten admin) or the mobile apps.

## Quickstart

```bash
pnpm install
pnpm dev
```

App runs at http://localhost:5173. Requires `.env.local` (copy from `.env.example`).

## Docs

- [CLAUDE.md](./CLAUDE.md) — onboarding, coding rules, layer rules
- [docs/](./docs/) — architecture, endpoints, design spec, implementation plan
