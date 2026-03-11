# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MooreItems is a Next.js 13.5 e-commerce platform (App Router) with CJ dropshipping, Stripe payments, Supabase (PostgreSQL) database, SendGrid email, and AI product enrichment. Deployed on Netlify at mooreitems.com.

## Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # ESLint (next lint)
npm run typecheck    # TypeScript check (tsc --noEmit)
```

No test framework is installed. Manual testing scripts live in `scripts/`.

## Architecture

### Stack
- **Framework:** Next.js 13.5 App Router, React 18, TypeScript
- **Database:** Supabase (PostgreSQL) with RLS — no ORM, raw queries via Supabase client
- **Payments:** Stripe (checkout sessions + webhooks)
- **Dropshipping:** CJ Dropshipping API (`lib/cj/`)
- **Email:** SendGrid (`lib/email/`)
- **AI:** Anthropic SDK, model `claude-sonnet-4-20250514`
- **UI:** shadcn/ui (Radix) primitives in `components/ui/`, Tailwind with custom navy/gold theme
- **Deployment:** Netlify with `@netlify/plugin-nextjs`, images unoptimized

### Path Alias
`@/` maps to project root. Always use `@/lib/...`, `@/components/...`, `@/hooks/...` — never relative imports.

### Database
All tables are prefixed `mi_` (e.g., `mi_products`, `mi_orders`, `mi_landing_pages`). Schema documented in `MI-SCHEMA.md`.

Three Supabase client patterns — use the right one:
- `lib/supabase/client.ts` → `createClient()` — browser/client components only
- `lib/supabase/server.ts` → `createServerSupabaseClient()` — server components and API routes (respects RLS)
- `lib/supabase/admin.ts` → `createAdminClient()` — bypasses RLS, for admin operations needing service role

### API Routes
All in `app/api/` as Route Handlers exporting named HTTP methods (`GET`, `POST`, etc.).

**Admin auth pattern** — every admin API route must call `requireAdmin()` at the top. The middleware protects admin *pages* but does NOT protect API routes; they must self-guard.

**Rate limiting** is IP-based using in-memory `Map<string, number[]>` (no external deps).

### State Management
Pure React Context — no Redux/Zustand. Four providers nested in `app/layout.tsx`:
- `CartProvider` — persisted to `localStorage` (key: `mi_cart_v1`)
- `AuthProvider` — Supabase session, exposes `useAuth()`
- `CategoriesProvider` — fetches from `/api/categories` on mount
- `WishlistProvider`

### Authentication
Supabase Auth with PKCE flow. Google OAuth via `/auth/callback`. Middleware gates `/admin/*` (requires `mi_admin_profiles` row) and `/account/*` (requires login).

### Pricing
Three-layer config: `lib/config/pricing.ts` (static defaults) → `mi_settings.pricing_config` (DB override) → `mi_category_pricing` (per-category). Server-side code must call `getPricingConfigFromDB()`.

### CJ API Client
Singleton in `lib/cj/client.ts` with two-level token caching (in-memory + `mi_settings` table), 3-second rate limiting, and 5-minute early expiry buffer. Never call `cjClient.authenticate()` directly — use the `apiCall` flow.

### Variant System
Use `lib/utils/variant-availability.ts` to build availability matrices. The `useVariantSelection` hook handles UI state. Never allow ordering invalid variant combos.

### Landing Pages
`mi_landing_pages.product_ids` is a UUID array; the builder sends `product_id` (singular) which the API wraps into `[product_id]`. `is_active` boolean maps to `status: 'live' | 'draft'` in the UI.

## Key Types
Core interfaces in `lib/types.ts`: `Product`, `ProductVariant`, `Category`, `Review`, `CartItem`, `BundleDiscount`. `whatsIncluded` is optional (`string[] | null`).

## Reference Docs
- `CODEBASE-MAP.md` — file-by-file map of the entire codebase
- `MI-SCHEMA.md` — full Supabase database schema
- `ENV-REFERENCE.md` — all environment variables
- `MooreItems-Project-Reference.md` — project history and business context

## Tailwind Theme
Custom colors: `navy-*` (dark blues), `gold-*` (warm golds), `warm-*` (neutral creams). Fonts: `font-playfair` (serif headings), `font-sans` (DM Sans body).

## UI/UX
For any frontend/component work, read .claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/SKILL.md before writing code.

## Brand
- Colors: Navy #0f1629 (primary), Gold #c8a45e (accent), Cream #f7f6f3 (background)
- Fonts: Playfair Display (headings), DM Sans (body)
- Tone: Premium but approachable — never generic/corporate
- Avoid: Purple gradients, stock-photo hero images, overly rounded "bubbly" UI, default Tailwind blue