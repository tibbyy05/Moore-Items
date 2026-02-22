# MooreItems.com — Project Reference Document

**Domain:** MooreItems.com
**Owner:** Danny Moore
**Business Email:** mooreitemsshop@gmail.com
**Started:** February 14, 2026
**Last Updated:** February 15, 2026
**Status:** Phase 3 Complete — Backend & CJ Integration Working

---

## Executive Summary

MooreItems.com is a custom-built e-commerce general store powered by CJ Dropshipping's API, designed to eliminate Shopify fees and app costs by leveraging a self-hosted tech stack. The business model combines an always-on curated product catalog across multiple categories with a trending-product advertising strategy using Meta/IG ads with niche-specific landing pages.

The core competitive advantage: zero platform fees, full automation from product listing through order fulfillment, and AI-powered ad creative generation — meaning every dollar goes toward advertising rather than infrastructure overhead.

---

## Current Project Status

### What's Built & Working
- ✅ Full storefront UI (homepage, categories, product pages, new arrivals, trending, deals)
- ✅ Admin dashboard (7 pages: Dashboard, Products, Orders, Customers, Analytics, Landing Pages, Ad Campaigns)
- ✅ Supabase database with 12 tables (all prefixed `mi_` to avoid conflicts)
- ✅ CJ Dropshipping API integration (auth, product sync, pricing engine)
- ✅ Product sync pipeline — 183 products synced from CJ with real pricing
- ✅ Pricing engine with 40% minimum margin enforcement
- ✅ Category auto-mapping (keyword-based matching to 8 store categories)
- ✅ Admin auth (Supabase Auth + admin_profiles role check)
- ✅ Product management (edit pricing, change status, delete, bulk actions)
- ✅ Copy-to-clipboard CJ PIDs for manual dashboard lookup
- ✅ Warehouse detection (defaults to CN, only marks US when CJ explicitly indicates)

### What's NOT Built Yet
- ❌ Stripe checkout (customers can't pay yet)
- ❌ Order pipeline (Stripe payment → CJ order creation → tracking)
- ❌ Customer auth (sign up, login, order history)
- ❌ Webhook handlers (Stripe + CJ)
- ❌ n8n automation workflows
- ❌ SendGrid email integration
- ❌ Abandoned cart recovery
- ❌ Review submission system
- ❌ Analytics event tracking
- ❌ Domain purchase & Netlify deployment
- ❌ CJ balance funding (needed before first real order)

---

## Business Strategy

### The Model

Two revenue streams operating simultaneously on one domain:

**1. Evergreen Catalog Store**
- Curated products across all categories (home, fashion, beauty, pets, electronics, fitness, kitchen, kids)
- Builds SEO over time, catches organic traffic
- Products sit and cost nothing — only fulfilled when orders come in
- Smart filtering ensures only quality products with workable margins are listed

**2. Trending Product Ad Funnel**
- Spot trending products on TikTok, social media, trend tools
- Generate ad creatives using Gemini (images) and Higgsfield (video)
- Create niche-specific landing pages on MooreItems.com
- Run Meta/IG ads at $5-20/day per test
- If it converts, scale. If not, kill the ad and move on
- Landing pages drive traffic to the broader store for cross-sells

### Why This Beats Shopify

| Cost | Shopify | MooreItems Custom |
|------|---------|-------------------|
| Platform fee | $39/mo | $0 |
| Bundle app | $10-15/mo | Built-in (free) |
| Email app | $10/mo | SendGrid free tier |
| Reviews app | $10/mo | Custom built (free) |
| Misc plugins | $20-30/mo | Custom built (free) |
| **Total monthly** | **$80-100/mo** | **$0/mo** |
| **Annual overhead** | **$1,000+** | **$0** |

All savings redirected into Meta ad spend — the only thing that actually generates revenue.

### Ad Budget Strategy

- Starting budget: $20/day
- At ~$1.25 avg CPC, that's roughly 16 clicks/day
- Test 3-4 niches at $5/day each simultaneously
- Double down on winners, kill losers within 1 week
- Need products with $30+ AOV so one sale covers daily ad spend
- Products should demo well in short video for best Meta performance

### Key Ad Benchmarks (2025 Data)

- Average e-commerce CPC on Meta: $1.37
- Fashion/apparel CPC can be as low as $0.45
- US-specific CPC average: $1.67
- Average e-commerce conversion rate: 1-3%
- Q4 (Nov) sees highest CPCs, Jan sees lowest

---

## Tech Stack

### Existing Infrastructure (Already Paid For)

| Service | Plan | Use |
|---------|------|-----|
| Netlify | Paid | Frontend hosting, CDN, SSL |
| Supabase | Paid | Database, auth, storage, edge functions |
| Stripe | Per-transaction | Payment processing |
| Gemini | Available | AI image generation for ad creatives |
| Higgsfield | Available | AI video generation for ad creatives |

### Services to Integrate

| Service | Cost | Use |
|---------|------|-----|
| CJ Dropshipping | Free (API) | Product sourcing, order fulfillment, shipping |
| n8n | Self-hosted or cloud | Workflow automation (order pipeline, sync, emails) |
| SendGrid | Free tier | Transactional emails, marketing emails |
| Meta Ads | Ad budget only | Customer acquisition |

### Build Tools

- **Bolt** — built the initial storefront and admin UI (Phase 2)
- **Cursor** — backend integration, API routes, database wiring (Phase 3+)
- **Claude** — architecture, prompts, debugging, project management
- **React / Next.js 13.5.1** — frontend framework (App Router)
- **Tailwind CSS** — styling
- **Supabase** — database, auth, real-time subscriptions
- **n8n** — workflow automation engine (future)

### Development Environment

- **Machine:** Windows PC
- **Project Path:** `C:\Websites\MooreItems\project`
- **Node/NPM:** Standard install
- **Dev Server:** `npm run dev` → http://localhost:3000
- **Admin Access:** http://localhost:3000/admin (requires auth)

---

## Design System

### Brand: MooreItems

- **Positioning:** A curated general marketplace — "More items, Moore value"
- **Tone:** Clean, trustworthy, modern — NOT a cheap dropship vibe (Nordstrom meets Target)
- **Logo:** Custom logo uploaded to project (gold/cream on dark, visible in admin sidebar with white background)

### Color Palette

**Primary (Dark — header, footer, hero, admin)**
- Navy deepest: `#0a0e1a`
- Navy medium: `#0f1629`
- Navy light: `#1a2340`

**Gold Accent**
- Gold primary: `#c8a45e` (CTAs, highlights)
- Gold hover: `#d4b574`
- Gold light: `#e0c78f`
- Gold dark: `#a8883e`

**Light Theme (storefront body)**
- White: `#ffffff`
- Warm cream: `#f7f6f3`
- Warm gray: `#efede8`

### Typography
- **Display/Headings:** Playfair Display
- **Body:** DM Sans

### Logo Usage
- "Moore" — Navy `#0f1629` on light / White on dark, Playfair Display Bold 700
- "Items" — Gold `#c8a45e`, Playfair Display Italic 400

---

## Supabase Configuration

### Project Details
- **Project URL:** https://vjiybpiuquttbaimywbt.supabase.co
- **Admin User ID:** 24a9cd8a-acd3-4312-b467-75e332c8bd2f
- **Admin Email:** mooreitemsshop@gmail.com
- **Admin Role:** super_admin

### Database Tables (all prefixed `mi_`)

All MooreItems tables use the `mi_` prefix to avoid conflicts with other projects in the same Supabase instance.

| Table | Purpose |
|-------|---------|
| `mi_products` | Product catalog synced from CJ |
| `mi_product_variants` | Sizes, colors, SKUs per product |
| `mi_categories` | 8 store categories |
| `mi_orders` | Customer orders |
| `mi_order_items` | Line items per order |
| `mi_carts` | Shopping carts (for abandoned cart recovery) |
| `mi_reviews` | Customer reviews with approval workflow |
| `mi_landing_pages` | Niche landing pages for ad campaigns |
| `mi_discount_codes` | Promo codes (MOORE50, WELCOME15 seeded) |
| `mi_wishlists` | Customer saved items |
| `mi_analytics_events` | Page views, add-to-cart, purchases |
| `mi_admin_profiles` | Admin users extending auth.users |

### Row Level Security
- Public read: active products, active categories, active landing pages, approved reviews
- Customer-specific: own orders, own cart, own wishlist, own reviews
- Admin-only: analytics, discount codes, admin profiles, full CRUD
- Helper function: `mi_is_admin()` checks mi_admin_profiles table

### Migrations Applied (5 total)
1. Core tables (12 tables with `mi_` prefix)
2. Performance indexes on all foreign keys, status fields, slugs
3. Auto-update triggers for `updated_at` columns
4. Row Level Security policies
5. Seed data (8 categories + 2 discount codes)

### Seeded Categories
1. Women's Fashion (`womens-fashion`)
2. Pet Supplies (`pet-supplies`)
3. Home & Garden (`home-garden`)
4. Health & Beauty (`health-beauty`)
5. Jewelry (`jewelry`)
6. Electronics (`electronics`)
7. Kids & Toys (`kids-toys`)
8. Kitchen (`kitchen`)

### Seeded Discount Codes
- `MOORE50` — 15% off orders over $50
- `WELCOME15` — 15% off any order

---

## CJ Dropshipping Integration

### Account Details

- **Account ID:** CJ5161322
- **Account Name:** Danny (Temporary user name)
- **Plan:** Free
- **API Access:** Yes — via Apps > API section in dashboard
- **Developer Docs:** https://developers.cjdropshipping.com/en/api/start/

### API Key

- Generated from: CJ Dashboard > Apps > Install App > API
- Stored in `.env.local` as `CJ_API_KEY`
- Used to obtain Access Token for all subsequent API calls

### API Base URL
`https://developers.cjdropshipping.com/api2.0/v1`

### Rate Limits (Free Plan)

- 1,000 calls per endpoint per day
- Product list v2 returns up to 200 results per page
- Maximum theoretical: 200,000 products/day pull capacity
- One IP limited to maximum 3 users

### Current Sync Status
- 183 products synced
- Categories auto-mapped via keyword matching
- Margins calculated (most 44-47% range)
- All products default to CN warehouse (7-16 day shipping)
- Products with valid margins → "Pending" status (awaiting admin approval)
- Products below 40% margin → "Hidden" status

### Known CJ Issues
- CJ product page URLs (cjdropshipping.com/product/-p-[PID].html) redirect to European-only error for US users — cannot link directly
- CJ API returns some discontinued/removed products — validation needed
- Some products have price ranges ("2.93 -- 3.77") instead of single prices — these are skipped during sync
- CJ dashboard "My Products" connection page is for Shopify/WooCommerce — not needed for custom API integration
- To look up products: copy PID from admin → paste into CJ Dashboard search bar (search by SPU/SKU)

### CJ Dashboard Pages You Actually Use
- **Orders** — monitor fulfillment status
- **Balance** — add funds (required before first real order)
- **API settings** — where API key lives
- **Product search** — verify products by searching PID

### API Endpoints Used

**1. Authentication**
- `POST /authentication/getAccessToken` — exchange API key for session token (cached with 5min buffer before expiry)

**2. Product Catalog**
- `GET /product/list` — query all products with filters (200/page)
- `GET /product/query?pid=` — get single product details (used for validation)
- `GET /product/getCategory` — get full category tree
- `GET /product/variant/queryByVid` — get variant details

**3. Logistics**
- `POST /logistic/freightCalculate` — calculate shipping cost by product, quantity, destination

**4. Shopping / Orders (NOT YET IMPLEMENTED)**
- `POST /shopping/order/createOrderV2` — create order (payType 2 = balance)
- `POST /shopping/order/deleteOrder` — cancel order

**5. Webhooks (NOT YET IMPLEMENTED)**
- `POST /webhook/set` — register callback URLs

### CJ Pricing Model

- $0/month subscription
- You pay: wholesale product cost + shipping cost per order
- Revenue model: customer pays retail via Stripe, you pay CJ wholesale + shipping, keep the difference
- **IMPORTANT:** Must fund CJ balance before first order can process

---

## Pricing Engine

### How It Works
```
For each product:
    CJ wholesale price (parseFloat, handle ranges)
    + Shipping cost (freight API or fallback: max(sellPrice * 0.3, $3.00))
    + Stripe fee (2.9% + $0.30)
    = Total cost

    Retail price = Total cost × markup multiplier (default 2.0x)
    Rounded to .99 pricing

    Auto-rules:
    - Minimum 40% margin or product auto-hidden
    - Price recalculates on every sync
    - Never sell at a loss
```

### File: `lib/pricing.ts`
- `calculatePricing(cjPrice, shippingCost, markupMultiplier)` → returns retailPrice, marginDollars, marginPercent, isViable
- All inputs parsed with parseFloat() to handle string values from CJ API
- NaN safety checks on all inputs

### Current Margin Observations
- Most products in 44-47% range with 2x markup
- Cheap products with $3 minimum shipping have tighter margins
- Consider 2.5x markup for products under $10 CJ cost

---

## Automation Architecture

### Full Order Pipeline (Zero-Touch) — NOT YET BUILT

```
Customer visits MooreItems.com
    → Browses products (data from Supabase, synced from CJ API)
    → Adds to cart
    → Checks out via Stripe
    → Stripe webhook fires to n8n
    → n8n creates order in CJ via API (createOrderV2)
    → n8n confirms order (addCart → addCartConfirm)
    → Order stored in Supabase with status "processing"
    → CJ fulfills and ships
    → CJ webhook fires with tracking number
    → n8n catches webhook, updates Supabase
    → n8n triggers SendGrid email to customer with tracking
    → Customer receives package
    → n8n triggers follow-up email (review request, cross-sell)
```

### Product Sync Pipeline — WORKING

```
Admin clicks "Sync CJ" or "Re-sync All" in dashboard:
    → Calls CJ /product/list for configured categories
    → Filters: price ranges skipped, discontinued products skipped
    → Category mapping via keyword matching
    → Pricing engine calculates margins
    → Products with ≥40% margin → "pending" status
    → Products with <40% margin → "hidden" status
    → Variants synced if available
    → Warehouse defaults to CN (US only if CJ explicitly indicates)
```

---

## Environment Variables (.env.local)

```
NEXT_PUBLIC_SUPABASE_URL=https://vjiybpiuquttbaimywbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ROTATE — was exposed in chat]
SUPABASE_SERVICE_ROLE_KEY=[ROTATE — was exposed in chat]
CJ_API_KEY=[ROTATE — was exposed in chat]
CJ_API_BASE_URL=https://developers.cjdropshipping.com/api2.0/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=mooreitemsshop@gmail.com
```

**⚠️ IMPORTANT: Keys were pasted in chat on Feb 15, 2026. Rotate ALL keys:**
- Supabase: Dashboard → Settings → API → regenerate
- CJ: Dashboard → Apps → API → regenerate
- Update .env.local after rotating

### Security
- `.env.local` is in `.gitignore` (confirmed — `.env*.local` pattern)
- Never commit keys to GitHub

---

## Key Project Files

### Backend / API Routes
| File | Purpose |
|------|---------|
| `lib/cj/client.ts` | CJ API client with auth token caching |
| `lib/cj/sync.ts` | Product sync service (fetch, price, categorize, upsert) |
| `lib/pricing.ts` | Pricing engine (calculatePricing function) |
| `lib/supabase/client.ts` | Browser Supabase client |
| `lib/supabase/server.ts` | Server Supabase client (API routes) |
| `lib/supabase/admin.ts` | Service role client (bypasses RLS) |
| `middleware.ts` | Protects /admin/* routes (excludes /admin/login) |
| `app/api/admin/sync/route.ts` | POST — trigger CJ product sync |
| `app/api/admin/resync/route.ts` | POST — delete all + fresh sync |
| `app/api/admin/products/route.ts` | GET/PATCH/DELETE — product CRUD |
| `app/api/admin/orders/route.ts` | GET — order counts |
| `app/api/admin/test-cj/route.ts` | GET — test CJ API for specific PID (debug tool) |
| `app/api/products/route.ts` | GET — public product listing |
| `app/api/categories/route.ts` | GET — active categories |

### Storefront Pages
| File | Purpose |
|------|---------|
| `app/page.tsx` | Homepage |
| `app/category/[slug]/page.tsx` | Category product listing |
| `app/new-arrivals/page.tsx` | New arrivals page |
| `app/trending/page.tsx` | Trending products page |
| `app/deals/page.tsx` | Deals & sales page |

### Admin Pages
| File | Purpose |
|------|---------|
| `app/admin/login/page.tsx` | Admin login |
| `app/admin/page.tsx` | Dashboard with stats |
| `app/admin/products/page.tsx` | Product management |
| `app/admin/orders/page.tsx` | Order monitoring |
| `app/admin/customers/page.tsx` | Customer list |
| `app/admin/analytics/page.tsx` | Analytics |
| `app/admin/landing-pages/page.tsx` | Landing page management |
| `app/admin/ad-campaigns/page.tsx` | Ad campaign tracking |
| `components/admin/Sidebar.tsx` | Admin sidebar with sync button, real counts |

---

## Storefront Design Direction

### Site Structure

- **Homepage:** Hero slider, trust signals, category grid, trending products, flash deals, newsletter signup
- **Category pages:** Filtered product grids with sort options
- **Product pages:** Large images, clear pricing, shipping estimate, related products, reviews
- **New Arrivals:** All active products sorted by newest
- **Trending:** Products with TRENDING/BESTSELLER badges
- **Deals:** Products with compare_at_price (sale items)
- **Landing pages:** Niche-specific entry points for ad traffic
- **Cart/checkout:** Clean Stripe integration (NOT YET BUILT)
- **Account:** Order history, tracking, saved items (NOT YET BUILT)
- **Admin dashboard:** Product management, order monitoring, analytics

### Key Features to Build

- Product search with filters (category, price range, shipping speed)
- Wishlist / saved items
- Dynamic bundle suggestions ("Frequently bought together")
- Product quick-view modal
- Mobile-first responsive design
- Discount code system
- Review/rating system
- Size guides (for clothing items)
- Estimated delivery date display
- "Back in stock" notification signup
- Recently viewed products
- Social proof notifications ("Someone just purchased...")

---

## Supplier Comparison (For Future Reference)

### CJ Dropshipping (CURRENT — Primary)

- Cost: $0/month
- API: Full access on free plan
- Products: 450K+
- Shipping: Global, US warehouse on select items (3-7 day), China (7-16 day)
- Best for: Trending products, variety, low-cost startup

### TopDawg (FUTURE — Potential Addition)

- Cost: $34.99-$159.98/month
- API: Premier plan only ($159.98/mo)
- Products: 500K+ all US-based
- Shipping: 2-5 day US shipping, all domestic
- Best for: Reliable fast-shipping evergreen catalog
- Consider adding once revenue justifies $140+/mo cost
- Note: Also based in Fort Lauderdale, FL

### Strategy

Start with CJ (free), prove the business model, then potentially run both:
- CJ for trending product ads and variety
- TopDawg for reliable US-only fast shipping catalog (once profitable)

---

## Build Phases

### Phase 1: Foundation ✅ COMPLETE
- [x] Business strategy defined
- [x] Domain selected (MooreItems.com)
- [x] CJ Dropshipping account created
- [x] API key generated
- [x] API documentation reviewed
- [x] Tech stack confirmed
- [x] Design system created (colors, typography, brand guidelines)
- [ ] Purchase domain
- [ ] Set up GitHub repository

### Phase 2: Storefront & Admin UI ✅ COMPLETE (Built in Bolt)
- [x] Design system (colors, typography, components)
- [x] Homepage (hero slider, category grid, trending, flash deals, newsletter)
- [x] Category pages with filters
- [x] Product detail pages
- [x] Admin Dashboard (stats, charts, recent orders)
- [x] Admin Products (CRUD, inline pricing, bulk actions)
- [x] Admin Orders (expandable rows, timeline)
- [x] Admin Customers, Analytics, Landing Pages, Ad Campaigns
- [x] Mobile responsive
- [x] Lucide icons replacing emoji placeholders

### Phase 3: Backend & CJ Integration ✅ COMPLETE (Built in Cursor)
- [x] Supabase schema creation (12 tables, mi_ prefix)
- [x] Indexes, triggers, RLS policies
- [x] Seed data (categories, discount codes)
- [x] CJ API client with auth token caching
- [x] Product sync pipeline
- [x] Pricing engine (40% minimum margin)
- [x] Category auto-mapping
- [x] Warehouse detection (defaults CN)
- [x] Admin auth (middleware + admin_profiles)
- [x] Product management (status, pricing, delete, bulk)
- [x] Sidebar with real counts + sync button
- [x] API routes for products, categories, sync
- [x] Storefront wired to real database
- [x] New Arrivals, Trending, Deals pages created

### Phase 4: Stripe & Checkout — NEXT
- [ ] Stripe checkout integration
- [ ] Cart persistence (Supabase)
- [ ] Order creation flow (Stripe → mi_orders → CJ createOrderV2)
- [ ] Stripe webhook handler (payment confirmation)
- [ ] CJ webhook handler (shipping/tracking updates)
- [ ] Order confirmation page
- [ ] Customer auth (sign up, login, order history)

### Phase 5: Automation (n8n)
- [ ] Order fulfillment pipeline (Stripe → CJ)
- [ ] Product sync cron jobs (daily)
- [ ] Inventory monitoring
- [ ] Email sequences (SendGrid)
- [ ] Abandoned cart recovery
- [ ] Analytics data collection

### Phase 6: Polish & Launch
- [ ] Domain purchase & DNS setup
- [ ] Netlify deployment
- [ ] Landing page templates for ad campaigns
- [ ] Initial product curation (activate 200-500 quality products)
- [ ] Meta Ads account setup
- [ ] First ad creative batch (Gemini + Higgsfield)
- [ ] CJ balance funding
- [ ] Launch ads ($20/day across 3-4 niche tests)

---

## Key Decisions Made

1. **Custom build over Shopify** — saves $1,000+/year, all savings go to ad spend
2. **CJ Dropshipping over TopDawg** — $0/month vs $140+/month, API access included free
3. **General store (MooreItems) over single-niche** — more products at zero marginal cost, let ads and data determine winning niches
4. **Niche-specific landing pages on general store** — best of both worlds: brand identity per ad campaign, broad catalog underneath
5. **Start with CSV/manual curation** — maintain quality control, automate import later
6. **$20/day ad budget** — test multiple niches at $5/day each, scale winners
7. **Automation-first architecture** — n8n handles order pipeline, product sync, emails, analytics
8. **mi_ table prefix** — avoids conflicts with existing tables in shared Supabase project
9. **Default CN warehouse** — honest default since most CJ free-plan products ship from China
10. **Copy PID instead of CJ links** — CJ product URLs don't work for US users, admin copies PID to search manually

---

## Deliverables Created

### Phase 1-2 (Design & UI)
- `MooreItems-Storefront-Light.jsx` — light hybrid storefront demo
- `MooreItems-Admin.jsx` — dark admin dashboard demo
- `MooreItems-Phase1-Bolt-Prompt.md` — storefront build specification for Bolt
- `MooreItems-Phase2-Admin-Bolt-Prompt.md` — admin build specification for Bolt
- `MooreItems-Design-System.md` — brand guidelines & component specs
- `MooreItems-Fix-Icons.md` — Lucide icon replacement guide

### Phase 3 (Backend Integration)
- `MooreItems-Phase3-Cursor-Prompt.md` — complete backend integration spec for Cursor

---

## Important Links

- CJ Dashboard: https://cjdropshipping.com/my.html#/dashboard
- CJ API Docs: https://developers.cjdropshipping.com/en/api/start/
- CJ Product API: https://developers.cjdropshipping.cn/en/api/api2/api/product.html
- CJ Shopping API: https://developers.cjdropshipping.cn/en/api/api2/api/shopping.html
- CJ Logistics API: https://developers.cjdropshipping.cn/en/api/api2/api/logistic.html
- CJ Webhook Docs: https://developers.cjdropshipping.com/en/api/api2/api/webhook.html
- CJ Webhook Mechanism: https://developers.cjdropshipping.cn/en/api/start/webhook.html
- Supabase Dashboard: https://supabase.com/dashboard/project/vjiybpiuquttbaimywbt

---

## Bugs / Issues to Address

1. **Rotate all API keys** — Supabase anon key, service role key, and CJ API key were exposed in Claude chat on Feb 15
2. **CJ returns discontinued products** — some synced products are removed from CJ catalog; need validation during sync or periodic cleanup
3. **Margins tight at 2x markup** — consider 2.5x for products under $10 CJ cost
4. **Many products "Uncategorized"** — keyword matching doesn't catch everything; may need manual categorization for edge cases
5. **Hardcoded sidebar counts** — partially fixed (Products count is real, Orders may still show hardcoded value)
6. **No favicon** — GET /favicon.ico returns 404 (cosmetic)
7. **metadataBase warning** — Next.js metadata.metadataBase not set

---

*This document serves as the single source of truth for the MooreItems.com project. Upload it to the Claude Project and use it to provide context at the start of any new Claude conversation about this project.*
