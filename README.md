# Richiva Dashboard

Super admin dashboard for managing Richiva's e-commerce operations. The app uses Next.js App Router, React, and Tailwind CSS v4, with mock data for dashboard workflows.

## Features

- Overview metrics and analytics charts
- Orders, products, customers, inventory, outlets, and shipping workflows
- Marketing, payments, returns, reviews, and support views
- User roles, audit views, and settings
- Interactive login, verification, and first-time setup screens

## Tech stack

- Next.js 16 App Router and React 19
- TypeScript and Tailwind CSS v4 with `@tailwindcss/postcss`
- Recharts and Lucide React
- pnpm, oxfmt, and oxlint

## Getting started

Use Node.js 20.9 or newer and pnpm.

```bash
pnpm install
pnpm dev
```

The development server listens on port 8443. Use `pnpm build` to create a production build and `pnpm start` to run it.

## Project structure

```text
src/
  app/       Next.js App Router, layout, authentication, and dashboard shell
  views/     Dashboard pages and feature-specific components
  ui/        Shared interface components and branding
  data/      Seed data used by the frontend
  lib/       Formatting and utility functions
```

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the Next.js development server on port 8443 |
| `pnpm build` | Build the production app |
| `pnpm start` | Start the production server on port 8443 |
| `pnpm format` | Format files with oxfmt |
| `pnpm lint` | Run oxlint |

## Authentication and environment

The current authentication and dashboard data are frontend demonstrations, not production security controls. The login UI reads `NEXT_PUBLIC_ADMIN_*` environment variables; Next.js exposes variables with the `NEXT_PUBLIC_` prefix to browser code. Do not put real passwords, 2FA codes, or backup codes in these variables. Use a server-side authentication service before deploying with real accounts.

Keep local values in `.env.local`. Environment files are ignored by Git and must not be committed.

## Deployment

This app uses the Next.js server and is not configured as a static export. Build with `pnpm build` and run with `pnpm start`. Configure image optimization for your deployment/CDN before enabling optimized remote images.