# MooreItems.com — Project Reference Document

**Domain:** MooreItems.com
**Owner:** Danny Moore
**Business Email:** mooreitemsshop@gmail.com
**Started:** February 14, 2026
**Last Updated:** March 15, 2026 (Session 44 final)
**Status:** Phase 36 — LIVE at mooreitems.com, **ready to launch first Meta ad**. Full order pipeline validated end-to-end. All pre-ads blockers cleared: Cookie consent banner live, Admin refund workflow built, Stripe Tax registration pending FL certificate. Daily auto-import pipeline running. Contact form live. CJ API daily limit upgraded to 5,000 requests/day. Catalog health check script fixed — was generating false alarms (2,019 phantom issues); real catalog health confirmed strong. **Full security audit completed (Session 30) — all 16 vulnerabilities resolved across Critical, High, Medium, and Low tiers.** **Real customer review system live (Session 31) — verified purchase gate, submission form, Verified Purchase badges.** **Landing Pages system fully built (Session 32) — AI-generated one-page landing pages with bundle/quantity discounts, crossfade image gallery, admin builder, public /lp/[slug] pages, view/conversion tracking.** **Homepage polished (Session 33) — hero text/images/animation, footer wordmark, noindex on landing pages, catalog 100% categorized, Product Scout relevance sorting.** **Session 34 — UX polish: search warehouse bug fixed, popular searches dropdown, ticker seamless loop + title case, category description collapse, hero image AI eligibility tagging (635/1000 products tagged), hero grid layout fixed, search "related to" pills.** **Session 35 — Admin dashboard upgrades: live visitor counter (GA4 Realtime API), Pending Fulfillment + Price Drift stat cards, Conversion Rate card removed. SEO fixes: soft 404s resolved (notFound() on inactive products), sitemap www→non-www corrected across 7 files, Search Console Validate Fix submitted.** **Session 44 — Mobile UX overhaul (2 critical + 12 medium + 6 low fixes), shipping times fixed everywhere (dynamic warehouse-aware), availability pipeline hardened (checkout + stock sync + webhooks), order pipeline fixed (variant required, variant_info saved, race condition retries, failed fulfillment surfaced), Featured Product homepage section + admin picker, hero rotation slowed to 12s, CJPacket Ordinary confirmed for CN→US shipping. Free shipping $50+ threshold enforced in checkout. Visitor stats dashboard live (GA4 historical: today/week/month counts + 7-day bar chart). GA4 realtime visitors fixed (force-dynamic + jsonb parse). Blender variant cleanup completed.**

---

## Executive Summary

MooreItems.com is a custom-built e-commerce general store powered by CJ Dropshipping's API, designed to eliminate Shopify fees and app costs by leveraging a self-hosted tech stack. The business model combines an always-on curated product catalog across multiple categories with a trending-product advertising strategy using Meta/IG ads with niche-specific landing pages. **Now also supports digital product sales** (PLR/MRR content, downloadable PDFs) alongside physical dropship products.

The core competitive advantage: zero platform fees, full automation from product listing through order fulfillment, AI-powered shopping assistant (unique differentiator — no other dropship store has this), AI-powered ad creative generation, and **hybrid digital + physical product support** — meaning every dollar goes toward advertising rather than infrastructure overhead.

**Major Milestone (Feb 24-25):** Site deployed LIVE to mooreitems.com via Netlify, Stripe live payments processing, first real transaction completed ($13.98), admin dashboard cleaned up, AI Product Polish feature built, Google Search Console verified with 3,073 pages indexed, Google Analytics GA4 tracking live (G-23H54T894J), 17 TypeScript errors fixed, dynamic sitemap + robots.txt, multiple bug fixes shipped.

**Major Milestone (Feb 25 — Session 11):** Massive data quality sweep: force-dynamic rendering on all 8 storefront pages (fixes stale price caching), 314 products recategorized (keyword + AI scripts), 131 product names AI-cleaned, 17 more junk products hidden, zero uncategorized products remaining. Image gallery order bug fixed (variant auto-select was hijacking main image on load). 8,269 variant records enriched with color/size data extracted from names — product pages now show proper color swatches and size selectors. Import pipeline gaps identified for next session.

**Major Milestone (Feb 26 — Session 12):** Meta Pixel installed (ID: 2064810427703961) with PageView, ViewContent, AddToCart, Purchase events — ad infrastructure ready. Import pipeline fixed with shared variant parser (`lib/utils/variant-parser.ts`) so future CJ imports auto-extract color/size data. Size selectors now sort logically (numeric, clothing, shoe sizes). Bulk AI polish completed: 1,643 product descriptions rewritten by Claude Haiku, zero products remaining without reviews. Weight enrichment ~2,900 products done (~127 remaining). CJ funding resolved: pay-per-order with PayPal/credit card (no wallet pre-funding needed). Meta Business Portfolio created.

**Major Milestone (Feb 26-27 — Session 13):** Full order pipeline validated end-to-end on live site — first real revenue earned (~$7.18 profit on $14.33 order, ~50% margin). CJ fulfillment debugged: error 1603000 resolved via debug logging, error 1604000 (insufficient balance) resolved by paying per-order in CJ dashboard with credit card. Phone number collection added to Stripe checkout for CJ shipping accuracy. Email capture popup built (WELCOME10 = 10% off, 10s delay, localStorage persistence). Abandoned cart recovery automated via Stripe `checkout.session.expired` webhook + SendGrid email with SAVE10 discount. Product page urgency signals added: live viewer counter, low stock badges, "X sold in last 24 hours". n8n trending product automation architecture planned for next session.

**Major Milestone (Feb 27-28 — Session 14):** Comprehensive SEO implementation across 5 phases: JSON-LD structured data (Product, BreadcrumbList, Organization, WebSite, CollectionPage, FAQPage schemas), unique per-page meta tags with OG images, image alt text, heading hierarchy fixes, noindex for filtered URLs. 13 category pillar pages with SEO descriptions and FAQ accordions. Enhanced sitemap with image tags, lastmod, changefreq, priority, and paginated category URLs. Custom 404 page. Google Merchant Center set up with 3,030 products approved for free Google Shopping listings. Admin dashboard fixed (RLS bypass for orders/customers), time filter added, manual order controls built. Automated CJ tracking sync with cron job (every 4 hours) + auto shipping emails. Social media profiles created (Instagram, Facebook, TikTok, LinkedIn) with official brand icons in footer. Homepage hero images now randomize from best sellers. Recently viewed section fixed to fetch fresh data instead of stale localStorage cache.

**Major Milestone (Feb 28 — Session 15):** Catalog health score went from 55% → 100%. Built automated catalog health monitor with 10 checks (zero-stock variants, missing images, orphaned products, pricing issues, missing reviews, missing descriptions, missing categories, missing weight, category count drift, stale pending). Fixed 1,252 orphaned products (41% of catalog had no variants — customers could browse but not buy) by creating 8,001 variants from existing CJ raw data. Fixed 2,667 zero-stock variants. Generated 20 missing descriptions via AI. CJ checkout validation added to block delisted products at payment time. 10 delisted CJ products removed. Weight data confirmed complete (3,018/3,018 CJ products). Promo code management system with influencer tracking. Daily health check cron job at 3 AM with email alerts via SendGrid when issues found. Import pipeline hardened to prevent future orphaned variants.

**Major Milestone (Feb 28 — Session 16):** Admin orders page fixed: stale pending orders (from abandoned checkouts) now auto-cleaned after 48 hours by tracking sync cron job, admin defaults to "Paid" tab with Delivered tab added. Shipping language updated sitewide from "Ships in 2-5 days" to "Delivered in 2-5 days". Homepage social proof stats section added (3,000+ Products, 39,000+ Reviews, 2-5 Days, 100% Secure). Major catalog curation: 14 supplements hidden (liability risk), 13 duplicate chenille sofas hidden, 5 small-image products hidden, "Butter Soft Capsules" hidden, 6 product names cleaned of promotional text. Compare-at price multiplier reduced from 1.8-2.2x to 1.3-1.6x for more believable "was" prices. Digital product urgency badges fixed (no more "Only 15 left" on unlimited downloads). Review counts randomized (were all showing 34). Google Merchant Center fully set up: shipping (2-5 day, $4.99 flat rate, free over $50), returns (30-day, by mail), ~2,840 products under review.

**Major Milestone (Mar 1 — Session 17):** Critical variant selection system overhaul — customers could previously select invalid color+size combos (e.g., White + 40 Inches when only Black 40" exists), order non-existent variants, and receive wrong products. Three-phase variant data repair: Phase 1 backfill script fixed broken variants, Phase 2 SQL pattern batches, Phase 3 automated prefix stripping + manual fixes — 444 products fixed, 3,773→0 broken variants, 95.1% of 28,104 variants now have color or size data. New availability matrix system (`lib/utils/variant-availability.ts`) builds cross-reference maps of valid combos per product. Updated `VariantSelector.tsx` greys out invalid options with strikethrough + 30% opacity. New `useVariantSelection` hook manages all variant state. Integrated into both ProductPageClient and QuickViewModal. Impossible to order non-existent variants. Works automatically for all current AND future products.

**Major Milestone (Mar 1 — Session 18):** Real-time CJ inventory sync via webhooks — eliminates the #1 remaining infrastructure gap (hardcoded stock counts). Registered STOCK, PRODUCT, and LOGISTICS webhooks with CJ API pointing to `https://mooreitems.com/api/webhooks/cj`. Discovered CJ's actual payload formats differ significantly from documentation (VARIANT type with flat params object, STOCK type with VID-keyed objects). Debugged serverless processing issue (Netlify terminates functions after response — moved all DB work before response). Handles three event types: STOCK with warehouse data (updates US warehouse stock counts), STOCK with empty arrays (zeros out depleted variants), VARIANT events (catches delistings via variantStatus=0, reactivates returns). Non-matching events silently dropped (CJ sends for entire catalog, not just store's ~3,000 products). Confirmed end-to-end with real database variant match (266ms processing time). Logging noise reduced — only logs on actual matches unless CJ_WEBHOOK_DEBUG=true. Three-layer inventory protection now complete: webhooks (real-time) → checkout validation (safety net) → health monitor (daily audit).

**Major Milestone (Mar 1 — Session 19):** Comprehensive AI-powered catalog cleanup — the deepest data quality pass since launch. Found widespread miscategorization from original keyword-based import scripts (e.g., "crystal" → Jewelry caught car wax, "USB" → Electronics caught bed frames). Built 4 AI audit scripts using Claude Haiku to systematically identify and fix issues. ~167 junk products hidden (auto parts, adult, industrial, duplicates), ~225 products recategorized into correct categories, 172 legitimate products rescued from hidden status (previously hidden as "junk" when they just needed correct categories), all with AI-cleaned names. Two UI bugs fixed: skeleton grid mismatch (4-col vs 3-col) and infinite scroll error handling. Total AI cost: ~$1.60. Final catalog: ~2,900 active products across 12 categories with significantly improved category accuracy. Recommendation: retire keyword-based categorization entirely, use AI (Haiku) directly in import pipeline for future products.

**Major Milestone (Mar 3 — Session 20):** China warehouse expansion — the biggest architectural change since launch. Full code audit revealed the system was already more CN-ready than expected (database `warehouse` column defaults to 'CN', types already support 'US' | 'CN' | 'CA', checkout already branches delivery estimates by warehouse). Only ~8 files needed targeted changes. Warehouse-aware CJ fulfillment routing (USPS+ for US, CJPacket for CN, per-product `wareHouseCountryCode`). Webhook handler now tracks both US and CN stock per-country. CN pricing config (2.2x markup, 45% min margin, $5 shipping estimate). New `import-cn-products.js` script. Product cards show amber "Delivered in 7-15 days" badge for CN products. Cart groups items by warehouse with per-group messaging. Google Merchant feed includes CN shipping rules (7-15 day transit). Ticker, about page, shipping policy, AI assistant, and all 12 category descriptions updated to reflect dual-warehouse model. First batch: 90 CN products imported, 71 active across 9 categories after AI categorization + junk filtering. All CN products fully enriched: multiple images, AI-polished names and descriptions, AI-generated reviews. Total implementation: ~2 hours, 10 steps, 331 insertions across 8 files.

**Major Milestone (Mar 6 — Session 24):** Category-aware pricing engine with persistent DB config — complete pricing overhaul. Root cause audit revealed: (1) pricing config was hardcoded in TypeScript, lost on every page refresh; (2) CN_PRICING_CONFIG existed but was dead code — CN products were being priced with US settings; (3) no per-category pricing or minimum price floors. Built in 3 phases: Phase 1 — DB foundation (`mi_category_pricing` table + `mi_settings` pricing_config row); Phase 2 — engine fixes (warehouse-aware config, category slug lookup via UUID map, min price floor enforcement, CN dead code fixed); Phase 3 — admin UI rebuild (3 sections: Global Settings with plain-English labels, Category Minimum Prices table, Live Preview + Reprice). New pricing: US 1.6x markup (was 2.0x), CN 1.8x (was broken/unused), 15% min margin (was 40%). Per-category floors: Jewelry $9.99, Electronics $14.99, Home & Furniture $12.99, etc. Full catalog repriced: 2,621 products. Zero products below category floor. Config now persists in DB — survives page refresh and cold starts. Commit: cd8fa7b → main.

**Major Milestone (Mar 6 — Session 23):** Fully autonomous inventory system — per-variant stock accuracy overhaul. Root cause discovered: `getInventoryByPid` returns both `inventories` (product-level totals) and `variantInventories` (per-variant breakdown) — all previous stock logic was only reading the product total and spreading it equally across variants. Fixed across every layer: `check-product-stock.js` now shows accurate per-VID US/CN stock in comparison table; `stock-sync/route.ts` replaced `getTotalStock` with `buildVariantStockMap` and now updates each variant individually using its actual CJ stock (zero always writes regardless of threshold); `health-check/route.ts` zero-stock auto-fix removed (was resetting accurately depleted variants back to 100, fighting the webhook system); webhook handler `const productIds` double-declaration bug fixed; PRODUCT webhook type added to handler and registration script (discontinued products now auto-hidden); color greying logic fixed in variant selector (colors now only grey out when truly out of stock across all sizes, not just missing the currently selected size). Stock sync cron job added to cron-job.org (4AM daily). Verified on jacket product: 43 variants correctly updated from DB stock=4 to CJ US stock=0, Blue/XL=1, White/L=2. Inventory system is now fully hands-off: stock up/down, product discontinued, variant delisted/reactivated — all handled automatically via webhooks (real-time) + daily sync (safety net) + health check (audit).

**Major Milestone (Mar 6 — Session 26):** Full A-to-Z site review completed (27-item audit across 4 priority tiers). Three pre-ads critical items knocked out: (1) **Florida Sales Tax Registration** — completed Florida Business Tax Application (DR-1) online, confirmation #249-6800-6526, certificate number pending via email to mooreitemsshop@gmail.com; once received, add to Stripe Tax → Registrations → "I've already registered" to activate automatic tax collection at checkout. (2) **SendGrid Domain Authentication** — confirmed `em1974.www.mooreitems.com` already verified with 100% sender reputation; no action needed. (3) **Contact Form** — fully functional: `app/api/contact/route.ts` built, admin notification email (with Reply-To set to customer email) + customer auto-reply both sending via SendGrid; form UI wired with full state management, loading/success/error states; emails currently landing in spam due to Gmail sender address (improves with volume/reputation). Committed: `feat: contact form — API route, admin notification, customer auto-reply`.

**Major Milestone (Mar 7 — Session 27):** All pre-ads blockers cleared — site is now legally and operationally ready to run Meta ads. (1) **Cookie Consent Banner** — `components/CookieConsent.tsx` built: fixed navy bottom bar, cream text, gold privacy policy link, Decline (ghost) + Accept All (solid gold) buttons, mobile stacked layout, sets `mi_cookie_consent` in localStorage, dispatches `mi:cookie-consent-accepted` custom event. Meta Pixel correctly gated: fbq stub always loads (JS queue only, no network), `fbevents.js` only loads after consent via `consentGiven` state + custom event listener. `<noscript>` pixel also gated. Placed before `</body>` in layout.tsx outside provider tree. (2) **Admin Refund Workflow** — `supabase/migrations/add_refund_columns.sql` adds `refund_status`, `refunded_at`, `stripe_refund_id` to `mi_orders`. New API route `app/api/admin/orders/refund/route.ts`: requireAdmin() guard, validates order is paid and not already refunded, calls `stripe.refunds.create()` with payment intent, updates DB with refund status/timestamp/Stripe refund ID. Admin orders page updated: paid orders show red "Refund" button in expanded Stripe section, confirmation dialog with amount, loading spinner, green "Refunded" badge with amount + date on success. Tested end-to-end on live $14.33 order — refund confirmed in Stripe dashboard. Note: local `.env.local` must use `sk_live_...` to refund live orders; `sk_test_...` cannot reach live payment intents.


**Major Milestone (Mar 7 — Session 30):** Full security audit completed before launching Meta ads — 16 vulnerabilities identified and resolved across 4 priority tiers. **Critical fixes:** (1) CJ webhook endpoint hardened with `timingSafeEqual` shared-secret validation (`CJ_WEBHOOK_SECRET` env var, URL-safe hex string) — previously 100% open to spoofed inventory manipulation; re-registered all CJ webhooks via fixed `scripts/register-cj-webhooks.js` with correct `/v1/webhook/set` endpoint and single-payload format; tested 401/401/200 for no-secret/wrong-secret/correct-secret. (2) AI Shopping Assistant rate-limited at 10 req/IP/min using native Map (no external deps) to prevent Anthropic API bill abuse. (3) PII logging in `lib/cj/fulfill-order.ts` gated behind `FULFILL_DEBUG=true` flag — full customer shipping payload (name, address, phone) was logging unconditionally to Netlify logs. **High fixes:** (4) All 33 `/api/admin/*` routes audited — all independently verify admin session via `requireAdmin()` before any logic (no middleware bypass possible). (5) Checkout rate-limited at 5 req/IP/10min — prevents promo code enumeration and CJ API drain. (6) Contact form rate-limited at 3 req/IP/hour — prevents SendGrid free tier exhaustion. **Medium fixes:** (7) HTTP security headers added to `netlify.toml` (X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy). (8) Public product API routes audited — `app/api/products/[slug]/route.ts` was using `select('*')` exposing `cj_raw_data`, `cj_price`, `margin_dollars`, `margin_percent` and all cost columns; replaced with explicit safe column list. (9) Guest order lookup timing attack fixed — previously returned different errors for "email not found" vs "wrong order number" (leaking customer existence); now identical 404 in both cases. (10) `HMAC_SECRET` confirmed added to Netlify (was missing — digital download tokens would have been forgeable). (11) Stripe webhook `constructEvent()` verified called before all order processing with immediate 400 on failure. **Low fixes:** (12) All Netlify env vars audited — no secret keys in `NEXT_PUBLIC_` variables. (13) `mi_settings` RLS was wide open (`to public, using (true)`) — CJ access token and pricing config readable by anyone with the anon key; fixed to `service_role` only for writes + new `authenticated + mi_admin_profiles` policy for admin reads.

**Major Milestone (Mar 7 — Session 31):** Real customer review system built end-to-end. Problem: all 39,534+ reviews were AI-generated with no write path for real customers — a trust gap as ad traffic scales. Solution: (1) **Database migration** (`supabase/migrations/20260307_customer_review_columns.sql`) — added `verified_purchase` (boolean), `reviewer_email` (text), `order_id` (text), `status` (text) columns to `mi_reviews`; unique index on `(reviewer_email, product_id) WHERE source='customer'` prevents duplicate reviews at DB level. Existing `is_approved` column retained — new rows set both `is_approved=true` AND `status='approved'` for backward compatibility. (2) **Submit API** (`app/api/reviews/submit/route.ts`) — validates all fields, verifies purchase via `mi_orders JOIN mi_order_items` using `email` column (discovered `customer_email` is always null — `email` is the correct column), blocks duplicates with 409, catches unique constraint violations (23505) as DB-level safety net, inserts with `source='customer'`, `verified_purchase=true`, `is_approved=true`, `status='approved'`, then recalculates `review_count` and `average_rating` on `mi_products`. (3) **Reviews display API** (`app/api/reviews/[productId]/route.ts`) — updated to use Postgres RPC function `get_product_reviews` with `CASE WHEN source='customer' THEN 0 ELSE 1 END` sort (simple DESC sort put 'generated' before 'customer' — RPC function fixed ordering). (4) **Product page UI** (`app/product/[slug]/ProductPageClient.tsx`) — green "Verified Purchase" badge with ShieldCheck icon on customer reviews; collapsible "Write a Review" section below reviews list with interactive 5-star picker, name/email/text fields, inline error/success states. All 8 checks verified: schema columns confirmed, happy path (200), purchase gate (403), duplicate block (409), review_count increment, correct sort order, browser UI confirmed. First real customer review live in production.

**Major Milestone (Mar 9 — Session 35):** Admin dashboard upgrades + SEO fixes. (1) **Live Visitors Counter** — GA4 Realtime API integrated into admin dashboard. Google Analytics Data API enabled in Google Cloud Console, service account `mooreitems-analytics@mooreitems.iam.gserviceaccount.com` created with Viewer access to GA4 property (ID: 525869349). `app/api/admin/realtime-visitors/route.ts` calls `runRealtimeReport` for `activeUsers` metric. Service account JSON key stored in `mi_settings` table (key: `ga4_service_account_key`) instead of env var — Lambda 4KB env var limit was exceeded when stored in Netlify; moving to Supabase fixed the deploy error. `GA4_PROPERTY_ID=525869349` remains as env var. Dashboard polls every 60 seconds with green pulsing dot indicator. (2) **Admin Dashboard stat card overhaul** — Conversion Rate card removed (was always 0.0% — no pageView data in DB to divide against). Replaced with **Needs Fulfillment**: queries `mi_orders` where `payment_status='paid' AND fulfillment_status='unfulfilled'`, turns red when count > 0, links to `/admin/orders`. **Needs Polish** card updated: now shows price drift count as subtitle (⚠ N price drifted / "All prices stable"), links to `/admin/catalog-health`. Both new counts added to dashboard API `Promise.all` as `pendingFulfillment` and `priceDriftCount`. `StatCard.tsx` already supported `subtitle` and `React.ReactNode` values. (3) **Soft 404 fixes** — Google Search Console flagged 14 soft 404s (inactive/hidden product pages returning HTTP 200 with empty content). Fixed `app/product/[slug]/page.tsx`: both `generateMetadata` and `ProductPage` now call `notFound()` from `next/navigation` when product is missing or `status !== 'active'`. Search Console Validate Fix submitted. (4) **Sitemap www → non-www** — entire sitemap was serving `https://www.mooreitems.com/` URLs despite canonical domain being `https://mooreitems.com/`. Root cause: `SITE_URL` / `BASE_URL` constants had www prefix. Fixed across 7 files: `lib/seo/constants.ts`, `app/sitemap.xml/route.ts`, `app/robots.ts`, `app/layout.tsx` (metadataBase), `app/api/feeds/google-merchant/route.ts`, `app/api/webhooks/stripe/route.ts` (abandoned cart URL), `lib/email/templates/new-order-admin.ts`. Bonus fix: abandoned cart recovery emails and admin order email links were also pointing to www URLs. Sitemap resubmitted to Search Console — all 2,583 pages now indexed with correct non-www URLs.

**Major Milestone (Mar 15 — Session 44):** Comprehensive mobile UX overhaul + shipping/availability/order pipeline hardening + Featured Product homepage section. **(1) Mobile UX Overhaul** — full audit found 2 critical, 12 medium, 6 low issues. Root-level horizontal overflow fixed (html/body overflow-x-hidden + 3 source causes: AnnouncementBar ticker, Header sticky, Best Sellers carousel). Product page image constrained to h-[40vh], overflow-x-hidden on main + content container, min-w-0 on gallery flex children. Header cart icon always visible (flex-shrink-0), search bar max-w-[160px] cap. QuickViewModal image constrained to max-h-[45vh] on mobile. ShoppingAssistant FAB moved to bottom-24 on mobile with z-30 to avoid sticky bar overlap. Email popup centered with mx-4, max-w-md on mobile. All touch targets increased to 44px (hamburger, cart drawer close, cart remove, back button). Safe-area padding added to mobile menu for notched phones. View All buttons visible on mobile, swipe hints added to carousels. Order confirmation flex-wrap on item rows. Breadcrumb href fixed from "\" to "/". **(2) Shipping Times Fixed Everywhere** — product cards now read warehouse field dynamically (both ProductCard files). Cart summary warehouse detection fixed to use warehouse field (not warehouse_status) with dynamic US/CN/mixed/digital banners. Order confirmation page uses dynamic delivery estimate from shipping_days → warehouse fallback. Order emails use dynamic delivery estimate matching product shipping_days. **(3) Availability Pipeline Hardened** — checkout layer 2 removed stale product-level stock_count check, added variant is_active check. Checkout layer 3 CJ API errors now cross-check DB stock before blocking (DB is source of truth). Stock sync product-level stock_count updated from variant totals after each batch. Structured error logging for persistent CJ API failures. Webhook reconcileProductStatus toggles is_active in sync with stock_count. **(4) Order Pipeline Fixed** — variant required: first available variant auto-selected on page load, inline error blocks add-to-cart if no variant selected, server-side guard in checkout rejects orders without variant_id. variant_info now written to mi_order_items at checkout (color · size). Order email race condition fixed with 3-attempt retry loop (2s delays). Order email variable shadowing bug fixed. Dynamic delivery estimates in order emails. Order confirmation shows variant color/size. Fulfillment race condition retry loop added. Silent fulfillment failures now set fulfillment_status='failed' (surfaced in admin). Admin orders Failed tab with red badge and retry fulfillment button. Stripe test mode skips CJ fulfillment and emails when event.livemode===false. CJ shipping method changed from 'CJPacket' to 'CJPacket Ordinary' for CN warehouse orders. CJ default shipping rule configured in CJ dashboard (Cost Priority, CJPacket Ordinary). **(5) Featured Product Section** — new full-width navy section on homepage below hero. Two-column layout: left = large product image, right = gold "Featured This Week" label, Playfair name, star rating, price with savings badge, benefit bullets (HTML-stripped from description), Shop Now + Add to Cart buttons. Admin picker at /admin/featured-product with live search, toast feedback, remove button. Stored in mi_settings key: featured_product_id. Featured Product link added to admin sidebar under STORE section. **(6) Hero Rotation** — HeroGrid.tsx interval changed 4000ms → 12000ms, HeroSlider.tsx changed 6000ms → 12000ms. **(7) Digital Downloads** — category image added: public/images/categories/digital-downloads.jpg.

**Pre-Ads Status (updated Session 27):**
- ✅ Cookie consent / GDPR banner — live (Session 27)
- ✅ Admin refund workflow — built and tested (Session 27)
- ⏳ Stripe Tax activation — waiting on FL certificate number email (confirmation #249-6800-6526); once received, add to Stripe Tax → Registrations → "I've already registered"

---

## Current Project Status

### What's Built & Working

**Core Infrastructure:**
- ✅ Full storefront UI — redesigned homepage with hero, 12-category showcase (4×3 grid), best sellers, deals, value props
- ✅ Admin dashboard (9 pages — light/fresh theme, grouped sidebar, Pricing Controls, Catalog Health, Visitor Stats dashboard with GA4 historical data + realtime, Pending Fulfillment + Price Drift stat cards)
- ✅ Supabase database with 14+ tables (all prefixed `mi_`)
- ✅ CJ Dropshipping API integration (auth with globalThis token caching, product sync, pricing engine)
- ✅ Stripe checkout integration (hosted Checkout Sessions, webhooks) — **LIVE MODE**
- ✅ Order fulfillment pipeline (Stripe webhook → CJ createOrderV2 with **warehouse-aware routing**: USPS+ for US, CJPacket Ordinary for CN, tracking sync)
- ✅ **Smart fulfillment routing** — CJ US products → USPS+, CJ CN products → CJPacket Ordinary, digital products → instant delivery, mixed orders handled correctly
- ✅ SendGrid email integration (order confirmation emails, auth emails via SMTP)
- ✅ Shared React providers (AuthProvider, CategoriesProvider) — eliminates duplicate API calls
- ✅ **Git version control** — GitHub repo at `tibbyy05/Moore-Items`
- ✅ **Claude Code** — terminal-based AI development tool integrated into workflow
- ✅ **Deployed to Netlify** — live at mooreitems.com with SSL
- ✅ **Google Analytics GA4** — Measurement ID: `G-23H54T894J`, tracking page views, scrolls, clicks
- ✅ **Google Search Console** — verified, sitemap submitted, 3,073 pages discovered, homepage indexed
- ✅ **Meta Pixel** — ID: `2064810427703961`, tracking PageView, ViewContent, AddToCart, Purchase events
- ✅ **Meta Business Portfolio** — "MooreItems" created in Meta Business Suite
- ✅ **Order pipeline validated end-to-end** — first real revenue earned ($14.33 order, ~$7.18 profit)
- ✅ **Email capture popup** — WELCOME10 discount (10% off), 10s delay, localStorage persistence
- ✅ **Abandoned cart recovery** — Stripe `checkout.session.expired` webhook → SendGrid email with SAVE10 code
- ✅ **Urgency signals** — live viewer counter, low stock badges, "X sold" on product pages
- ✅ **Stale pending order cleanup** — auto-deletes abandoned checkout orders (payment_status='pending') older than 48 hours via tracking sync cron job (Session 16)
- ✅ **Homepage social proof section** — 4 trust stats (3,000+ Products, 39,000+ Reviews, 2-5 Days Delivery, 100% Secure) with gold Lucide icons, Playfair Display numbers, cream background (Session 16)

**Variant Availability System (NEW — Session 17):**

**CJ Webhook Real-Time Stock Sync (Sessions 18 + 23):**
- ✅ **Four webhook types registered** — STOCK, PRODUCT, LOGISTICS, VARIANT all pointing to `https://mooreitems.com/api/webhooks/cj`
- ✅ **Webhook receiver** — `app/api/webhooks/cj/route.ts` handles all CJ webhook events
- ✅ **STOCK events with data** — parses VID-keyed objects with warehouse arrays, updates `mi_product_variants.stock_count` per-variant using `variantInventories` (not product-level total)
- ✅ **STOCK events with empty arrays** — CJ sends `{VID: []}` when stock cleared; handler zeros out matched variants, sets product to `out_of_stock` if all variants depleted
- ✅ **VARIANT events** — catches delistings (`variantStatus: 0` → deactivate variant, zero stock), reactivates returns (`variantStatus: 1`)
- ✅ **PRODUCT events** — `handleProductUpdate()` catches discontinued products (`productStatus: 0` → set `out_of_stock`, update category count); reactivation ignored (daily sync handles after verifying stock)
- ✅ **Serverless-compatible** — all DB work completes before response (Netlify terminates functions after response)
- ✅ **Flexible payload parsing** — handles three shapes: flat array, VID-keyed object with arrays, VID-keyed object with single entries (CJ docs don't match reality)
- ✅ **Auto-discovery for new products** — real-time DB lookup on every event, newly imported products automatically matchable by `cj_vid`
- ✅ **Quiet logging** — only logs on actual matches; raw body logged only when `CJ_WEBHOOK_DEBUG=true` env var set
- ✅ **Product cascade** — when all variants of a product hit zero stock, product automatically set to `status: 'out_of_stock'`
- ✅ **Registration script** — `scripts/register-cj-webhooks.js` for one-time webhook setup with CJ API
- ✅ **Confirmed end-to-end** — real variant matched (PHOERA Eyebrow Pencil, VID 1460857153295355904) in 266ms
- ✅ **Availability matrix** — `lib/utils/variant-availability.ts` builds cross-reference maps of valid color+size combos per product from actual variant data

**China Warehouse Expansion (NEW — Session 20):**
- ✅ **Dual-warehouse product catalog** — ~2,439 US warehouse products + ~71 CN warehouse products live across 9 categories
- ✅ **CN pricing config** — `lib/config/pricing.ts` exports `CN_PRICING_CONFIG` (2.2x markup, 45% min margin, $5 shipping estimate) and `getPricingConfig(warehouse)` helper
- ✅ **Warehouse-aware CJ fulfillment** — `lib/cj/fulfill-order.ts` routes each product to its correct warehouse: US → `USPS+`/`wareHouseCountryCode: 'US'`, CN → `CJPacket Ordinary`/`wareHouseCountryCode: 'CN'`; per-product routing in mixed orders
- ✅ **Dual-warehouse webhook stock sync** — `app/api/webhooks/cj/route.ts` tracks stock per country code (US + CN), matches against product's actual warehouse; US products use US stock, CN products use CN stock
- ✅ **CN import pipeline** — `scripts/import-cn-products.js` imports CN warehouse products from CJ with CN-specific pricing, shipping estimates (7-15 days), and margin thresholds (45%)
- ✅ **Product card CN badge** — amber Globe icon with "Delivered in 7-15 days" for CN products (green Truck "Delivered in 2-5 days" for US unchanged)
- ✅ **Cart warehouse messaging** — groups items by warehouse: US-only, CN-only, mixed, and digital combos each show appropriate delivery estimates
- ✅ **Checkout stores warehouse per order item** — `mi_order_items.warehouse` column tracks which warehouse each line item ships from
- ✅ **Google Merchant feed CN shipping** — CN products get "International Standard" service with 7-15 day transit, $6.99 rate
- ✅ **Sitewide messaging updated** — ticker, about page, shipping policy, AI assistant system prompt, and all 12 category descriptions reflect dual-warehouse model
- ✅ **Product page already had CN support** — `ProductPageClient.tsx` already branched on warehouse for shipping badges and "Ships from China" messaging
- ✅ **Updated VariantSelector** — greys out invalid options (strikethrough + 30% opacity), tooltip explains why unavailable, auto-adjusts selection to maintain valid combos
- ✅ **useVariantSelection hook** — `hooks/useVariantSelection.ts` manages all variant state (color, size, matched variant, image fallback, add-to-cart protection)
- ✅ **Add-to-cart protection** — button disabled unless valid variant combo selected, shows "Select valid options" text
- ✅ **Image fallback chain** — exact combo image → same color any size → first available variant image
- ✅ **Integrated into ProductPageClient + QuickViewModal** — both use new system
- ✅ **Variant data quality: 95.1%** — 28,104 total variants, 95.1% have color or size populated (up from ~50% in Session 11)
- ✅ **444 broken multi-variant products fixed** — 3,773→0 broken variants across 3-phase repair (backfill script, SQL batches, automated prefix stripping)
- ✅ **Works automatically for future imports** — matrix built from variant data, no per-product config needed

**Catalog Health Monitor (Sessions 15 + 23):**
- ✅ **Health check API** — `POST /api/admin/catalog/health-check` with 10 automated checks, dual auth (secret key for cron OR admin session)
- ✅ **10 checks:** zero-stock active variants (MEDIUM, informational only — auto-fix removed in Session 23 as it was fighting accurate webhook data), missing images (HIGH), missing category (HIGH), pricing issues (HIGH), orphaned products (HIGH), missing reviews (MEDIUM), missing description (MEDIUM), missing weight (LOW), category count drift (LOW, auto-fix), stale pending (LOW)
- ✅ **Admin dashboard** — `/admin/catalog-health` with health score visualization (color-coded), expandable check cards grouped by severity, links to edit affected products
- ✅ **Daily cron job** — cron-job.org at 3:00 AM EST, `HEALTH_CHECK_SECRET` auth
- ✅ **Email alerts** — SendGrid notification to mooreitemsshop@gmail.com when issues found (skips email if 100% healthy)
- ✅ **Supabase pagination fix** — `fetchAll()` helper paginates in batches of 1,000 (bypasses Supabase default row limit)

**CJ Checkout Validation (NEW — Session 15):**
- ✅ **Checkout validates CJ stock** — `/api/checkout` calls CJ inventory API for each CJ product before creating Stripe session
- ✅ **Blocks delisted products** — returns error with product name if CJ reports 0 stock or product not found
- ✅ **Prevents failed fulfillment** — customers can't pay for items CJ has removed from their catalog

**SEO (Comprehensive — Session 14):**
- ✅ **JSON-LD Structured Data** — Product schema (price, availability, aggregateRating, SKU, priceValidUntil, hasMerchantReturnPolicy, shippingDetails), BreadcrumbList, Organization, WebSite with SearchAction, CollectionPage, FAQPage on category pages — all validated in Google Rich Results Test
- ✅ **Per-page meta tags** — unique title, description, canonical URL, OG tags with product images, Twitter cards, price meta tags on all product/category/static pages
- ✅ **Image alt text** — position-based descriptive text on gallery images, thumbnails, lightbox, product cards
- ✅ **Heading hierarchy** — fixed H2/H3 structure on category pages, proper semantic HTML
- ✅ **Breadcrumb styling** — warm text colors, gold hover, ">" separators
- ✅ **Noindex filtered URLs** — middleware adds X-Robots-Tag for /shop with query params (except ?page=N)
- ✅ **Category pillar pages** — 13 categories with 150-250 word SEO descriptions and 3-4 FAQ items each, FAQ accordion sections, FAQPage schema
- ✅ **Enhanced sitemap** — `app/sitemap.xml/route.ts` with image tags, lastmod, changefreq, priority, paginated category URLs, 6hr cache
- ✅ **Custom 404 page** — search bar, 8 popular category links with icons, "Back to Home" CTA
- ✅ **Pagination SEO** — `<link rel="prev/next">` on listing pages, ?page=N support
- ✅ **robots.txt** — allows public API routes (`/api/products/`, `/api/categories/`, `/api/reviews/`, `/api/search/`, `/api/feeds/`), blocks private routes (`/api/admin/`, `/api/webhooks/`, `/api/checkout/`, etc.) — fixes Googlebot rendering issues on product pages
- ✅ **Google Merchant Center** — ~2,840 products under review, free Google Shopping listings, daily feed fetch. Fully configured: flat-rate $4.99 shipping (free over $50), 2-5 business day delivery, 30-day return policy, returns by mail (Session 16)
- ✅ **Product feed** — `/api/feeds/google-merchant` RSS 2.0 XML with Google product taxonomy mapping, sale prices, shipping, images

**Social Media Profiles:**
- ✅ **Instagram** — https://www.instagram.com/mooreitems
- ✅ **Facebook** — https://www.facebook.com/profile.php?id=61575170498498
- ✅ **TikTok** — https://www.tiktok.com/@mooreitems
- ✅ **LinkedIn** — https://www.linkedin.com/company/mooreitems
- ✅ **Official brand icons** — react-icons (FaInstagram, FaFacebookF, FaTiktok, FaLinkedin) in footer

**Automated Tracking & Shipping (Session 14, Updated Session 16):**
- ✅ **Tracking sync API** — `/api/admin/orders/sync-tracking` checks CJ for tracking numbers on processing orders
- ✅ **Auto shipping emails** — when tracking found, auto-sends branded shipping notification with USPS tracking link
- ✅ **Stale pending order cleanup** — auto-deletes mi_order_items then mi_orders where payment_status='pending' and created_at > 48 hours ago (Session 16)
- ✅ **Cron job** — cron-job.org runs POST every 4 hours with secret key auth (`TRACKING_SYNC_SECRET`)
- ✅ **Admin Sync Tracking button** — manual trigger on orders page, toast shows stale cleanup count
- ✅ **Duplicate prevention** — shipping_email_sent_at timestamp prevents re-sending

**Product Catalog:**
- ✅ **~2,510 active products** — ~2,439 US warehouse + ~71 CN warehouse across 12 physical categories + Digital Downloads (Session 20: CN expansion added 90 imports, 71 active after AI categorization + junk filtering)
- ✅ **Digital products supported** — PDF uploads to private Supabase Storage bucket
- ✅ **All products categorized** across **13 categories** (12 physical + Digital Downloads) — zero uncategorized
- ✅ **Product names cleaned** — 3,397 original + 496 additional + 131 AI-cleaned (Session 11) + 1,643 bulk polished (Session 12) + 6 promotional text stripped (Session 16) + 80 AI-cleaned during hidden product rescue (Session 19)
- ✅ **~380 junk/risky products hidden** — 113 original + 46 additional + 17 AI-detected (Session 11) + 2 more (Session 15) + 14 supplements + 13 duplicate sofas + 5 small-image + 2 misc (Session 16) + ~167 junk/duplicates (Session 19 AI audit)
- ✅ Full enrichment: image galleries (5-37 per product), HTML descriptions, size/color variants
- ✅ **All product descriptions AI-polished** — 1,643 products rewritten via bulk Claude Haiku script (Session 12) + 20 more generated (Session 15). AI Improve feature added to admin edit page (Session 42) — per-product enrichment via Claude Haiku with accept/reject drawer UI
- ✅ **All products have reviews** — zero products with review_count = 0
- ✅ **Variant color/size data enriched** — 8,269 variants parsed from names (Session 11), ~28,104 total variants, **95.1% have color or size** (Session 17 — up from ~50%)
- ✅ **444 broken multi-variant products fixed** — 3-phase repair: backfill script, SQL pattern batches, automated prefix stripping (Session 17)
- ✅ **All products have variants** — 1,252 orphaned products fixed by creating 8,001 variants from CJ raw data (Session 15)
- ✅ Color variant image switching (clicking color swatches switches main product image)
- ✅ **Variant size selectors sorted** — numeric ascending, clothing XS→4XL, shoe sizes, alphabetical fallback (Session 12)
- ✅ **Shared variant parser** — `lib/utils/variant-parser.ts` used by both enrichment script and admin CJ import (Session 12)
- ✅ Centralized pricing engine (`lib/config/pricing.ts`) with admin UI controls
- ✅ **Per-variant stock counts accurate** — `buildVariantStockMap()` reads `variantInventories` from CJ API, each variant reflects its actual warehouse stock (not a product-level total spread equally). Verified Session 23.
- ✅ Category `product_count` column populated with real counts
- ✅ **All 3,018 CJ products have weight data** — productWeight in cj_raw_data (confirmed complete Session 15)
- ✅ **`force-dynamic` rendering** on all 8 storefront pages — prevents stale pricing from build cache

**Admin Dashboard (Cleaned Up — Feb 24, Fixed — Feb 28):**
- ✅ **Sidebar reorganized** — grouped into STORE (Dashboard, Products, Import Products, Hero Images, Featured Product), OPERATIONS (Orders, Customers, Promo Codes, Landing Pages), TOOLS (Catalog Health), SETTINGS (Pricing, Shipping), COMING SOON (Analytics Beta, Ad Campaigns greyed out with badges)
- ✅ **Dashboard** — real data only, fake change percentages removed, "Needs Polish" stat card (violet), Quick Actions row (Add Product, Reprice All with confirmation, View Store). **Visitor Stats section (Session 44):** 4 stat cards (Live Now with green pulse, Today, This Week, This Month) + gold recharts bar chart showing last 7 days of visitors. Powered by `/api/admin/visitors` route with parallel GA4 Realtime + Historical API calls, polls every 60s.
- ✅ **Dashboard RLS fix** — uses admin service role client via `/api/admin/dashboard` to bypass RLS and show all orders/customers (Session 14)
- ✅ **Dashboard time filter** — dropdown: Today, This Week, Last Week, This Month, Last Month, This Quarter, All Time (Session 14)
- ✅ **Products page** — working pagination (Previous/Next, page numbers, "Showing X-Y of Z"), dead "Import CSV" button removed
- ✅ **Orders page** — defaults to "Paid" tab, tabs reordered: Paid, Processing, Shipped, Delivered, All Orders, Pending, Unfulfilled. Manual controls (status, tracking, clear notes), Sync Tracking button (Session 14, updated Session 16)
- ✅ **Customers page** — RLS fixed via `/api/admin/customers` admin client route (Session 14)
- ✅ **Analytics page** — fake conversion rate and change percentages removed, dead time-range buttons removed, empty table columns removed
- ✅ **Landing Pages** — "New Landing Page" button disabled with "Coming Soon", per-row action buttons removed
- ✅ **Ad Campaigns** — "New Campaign" button disabled with "Coming Soon"
- ✅ **Catalog Health** — `/admin/catalog-health` health score, 10 checks grouped by severity, expandable product lists, Run Health Check button (Session 15)
- ✅ **Settings link removed** from sidebar (page doesn't exist)

**AI Product Polish (NEW — Feb 24):**
- ✅ **Polish API** — `POST /api/admin/products/polish` uses Claude Sonnet to clean product name, rewrite description (2-3 paragraphs marketing copy), suggest better category, then Claude Haiku to generate 3-5 reviews
- ✅ **Polish Modal** (`components/admin/PolishModal.tsx`) — three states: Ready (product preview), Loading (spinner), Results (before/after diffs with accept/reject checkboxes per field)
- ✅ Reviews saved immediately to DB; name/description/category changes require user approval via "Apply Selected Changes"
- ✅ Purple Sparkles button on each CJ product row in admin products table
- ✅ "Needs polish" amber indicator on rows where review_count=0 or null
- ✅ "Polish This Product" button in product preview modal

**Add Product System:**
- ✅ **Admin Add Product page** (`/admin/products/add`) with two tabs:
  - **Manual Product tab** — for digital products: name, description, category, pricing, file upload, auto-slug, status (defaults to active for digital)
  - **CJ Import tab** — paste CJ Product ID, preview product details (images, pricing, variants, warehouse, stock), edit name, assign category, import to catalog
- ✅ **CJ import preview** — shows wholesale price, auto-calculated retail price, margin, variant count, US stock quantity, warehouse badge
- ✅ **US warehouse detection fixed** — import route calls CJ stock/inventory API before warehouse detection
- ✅ **Duplicate detection** — prevents importing same CJ product twice

**Edit Product Page:**
- ✅ **Full edit form** for any product, supports digital file replacement
- ✅ **Image reorder controls** — thumbnail grid (4 columns), position badges (gold "Main" on first), hover controls: star to set as main, left/right arrows to shift, X to remove

**Digital Product Delivery System:**
- ✅ **File upload** — PDFs uploaded to private `digital-products` Supabase Storage bucket via `/api/admin/products/upload-digital`
- ✅ **Digital detection** — `isDigital()` helper checks `digital_file_path`, category slug, or manual product fingerprint
- ✅ **Digital-aware checkout** — all-digital carts skip shipping address collection, $0 shipping cost
- ✅ **Instant delivery** — Stripe webhook marks digital orders as `delivered` immediately (not `processing`)
- ✅ **Secure downloads** — signed Supabase Storage URLs (1-hour expiry), generated on demand via `/api/downloads/[orderId]/[itemId]`
- ✅ **Guest download access** — HMAC-SHA256 token-based URLs allow downloads without login (tokens included in confirmation emails)
- ✅ **Order confirmation page** — shows "Download" button for digital items, "Instant Download" delivery badge, no shipping section
- ✅ **Order history** — download buttons on order detail page for digital items
- ✅ **Email** — confirmation email includes download links with HMAC tokens, digital delivery badges, conditional shipping section
- ✅ **Cart awareness** — cart page shows "Instant Digital Download" banner for digital items, "Free" shipping for all-digital carts
- ✅ **Storefront product page** — violet "Instant Digital Download" banner, digital-appropriate delivery/returns accordion text
- ✅ **Mixed cart support** — physical items ship normally, digital items download instantly regardless of physical item fulfillment status
- ✅ **Webhook backup** — confirmation page checks Stripe directly and updates payment status if webhook missed

**AI Review Generation:**
- ✅ **Generate Reviews API** — `POST /api/admin/products/generate-reviews`
- ✅ Uses Claude Haiku (`claude-haiku-4-5-20251001`) for cost efficiency
- ✅ Generates 3-5 realistic reviews per product based on name, description, price, category
- ✅ Reviews: varied ratings (3-5 stars), realistic names, 80% verified badge, dates spread 1-90 days ago
- ✅ Auto-updates `review_count` and `average_rating` on `mi_products`
- ✅ Purple "Generate Reviews" button with Sparkles icon in admin product preview modal

**Order Fulfillment — Smart Routing:**
- ✅ **CJ products** → `fulfillCJOrder()` as before
- ✅ **Digital/manual products** → skips CJ API, sets `fulfillment_status: 'unfulfilled'` with "manual fulfillment" note
- ✅ **Mixed orders** — CJ items fulfilled via CJ API, non-CJ items flagged for manual fulfillment
- ✅ **Admin UI** — purple "Manual Fulfillment Required" badge instead of broken "Retry CJ Fulfillment" button for non-CJ orders

**Guest Order Access:**
- ✅ **Guest order lookup page** (`/order/lookup`) — enter order number + email to view order and download digital products
- ✅ **Email-based order matching** — order history now matches by email (case-insensitive with `ilike`), not just `auth_user_id`
- ✅ **RLS bypass** — order history uses server-side API routes (`/api/account/orders`, `/api/account/orders/[id]`) with admin client instead of client-side Supabase queries
- ✅ **Cart sends user email** during checkout for reliable order-to-account linking
- ✅ **Login page** links to guest order lookup

**Pricing Engine (Category-Aware — Session 24):**
- ✅ **Persistent config in DB** — pricing config stored in `mi_settings` (key: `pricing_config`), loaded on every reprice. Survives page refresh and Netlify cold starts. Falls back to hardcoded constants if DB unavailable.
- ✅ **Warehouse-aware pricing** — US products use 1.6x markup, CN products use 1.8x markup. CN dead code bug fixed (was using US config for all products).
- ✅ **Per-category pricing rules** — `mi_category_pricing` table with min_price, target_margin, markup_override per category. 12 categories seeded.
- ✅ **Minimum price floors enforced** — Jewelry $9.99, Electronics $14.99, Home & Furniture $12.99, Fashion $9.99, Health & Beauty $6.99, Kids & Toys $7.99, Kitchen & Dining $9.99, Pet Supplies $6.99, Sports & Outdoors $9.99, Storage & Organization $7.99, Tools & Hardware $9.99, Garden & Outdoor $12.99
- ✅ **New global margins** — US: 15% min (was 40%), CN: 20% min (was 45%) — more products price instead of being skipped
- ✅ **New markup** — US: 1.6x (was 2.0x), CN: 1.8x (was 2.2x) — lower prices for launch, raise later with traffic
- ✅ **Admin UI rebuilt** — plain English labels, US/CN side-by-side cards, category table, live preview, persistent save
- ✅ **compare_at_price** with 1.3-1.6x random multiplier (unchanged)
- ✅ **Repricing skips manual/digital products** (cj_price = 0 — correct behavior)
- ⚠️ **Digital products use category floor** — Kids Printable Activity Bundle ($4.99) lifted to $7.99 by Kids & Toys floor. Consider exempting digital products from floor enforcement in a future session.

**Reviews System (Updated Session 31):**
- ✅ **39,534+ AI-generated reviews** (V3 generator + per-product generation via admin + Polish feature)
- ✅ All reviews 4-5 stars only (65% five-star, 35% four-star)
- ✅ Dates within last 60-90 days (always show as "X days/weeks ago" — never stale)
- ✅ Realistic names ("Sarah M.", "Michael T."), 80% verified badge
- ✅ Country distribution: 75% US, 10% CA, 8% GB, 4% AU, 3% DE
- ✅ Review counts randomized per product: $100+ → 8-35 reviews, $30-99 → 4-20, <$30 → 1-12 (fixed in Session 16 — were all showing 34)
- ✅ Relative date display (timeAgo helper) so reviews never look outdated
- ✅ **Per-product generation** via admin "Generate Reviews" button (Claude Haiku)
- ✅ **Also generated via Polish feature** (reviews are saved immediately during polish)
- ✅ **Real customer review submission** — `app/api/reviews/submit/route.ts` with purchase verification gate (Session 31)
- ✅ **Verified Purchase badge** — green ShieldCheck pill on customer reviews (source='customer') (Session 31)
- ✅ **Customer reviews sort first** — Postgres RPC `get_product_reviews` ensures source='customer' always appears above AI reviews (Session 31)
- ✅ **Duplicate protection** — API check + unique DB index on (reviewer_email, product_id) WHERE source='customer' (Session 31)

**AI Shopping Assistant:**
- ✅ Floating chat bubble on every page (gold, bottom-right corner)
- ✅ Full chat panel with conversation history (up to 10 messages)
- ✅ Backend: extracts keywords/price/category from user query → searches Supabase → sends to Claude API
- ✅ Uses `claude-sonnet-4-20250514` model via `@anthropic-ai/sdk`
- ✅ Product recommendations with thumbnails, prices, ratings, and "View Product" links
- ✅ Quick prompt pills on welcome screen
- ✅ Full-screen on mobile, panel on desktop
- ✅ "Powered by Ai-genda.com" branding in header
- ✅ Graceful error handling when API key missing or call fails

**Customer Authentication & Accounts:**
- ✅ **Email/password signup** with email confirmation (SendGrid SMTP)
- ✅ **Google OAuth** with MooreItems branding on consent screen (production origins + redirects configured)
- ✅ **Supabase custom auth domain** — `auth.mooreitems.com`
- ✅ **Login page** (`/login`) — email/password + Google sign-in + guest order lookup link
- ✅ **Signup page** (`/signup`) — full name, email, password + Google
- ✅ **Forgot password** (`/forgot-password`) — sends reset link
- ✅ **Reset password** (`/reset-password`) — new password form
- ✅ **Auth callback** (`/auth/callback`) — handles Google OAuth redirect
- ✅ **Database trigger** — auto-creates `mi_customers` row on signup (SECURITY DEFINER, uses `public.mi_customers`)
- ✅ **Middleware** — protects `/admin/*` routes, `/account/*` routes, redirects to `/login` if not authenticated
- ✅ **Header** — user icon links to `/login` or `/account` based on auth state
- ✅ **AuthProvider** — single `getUser()` + `mi_customers` fetch shared across all components

**My Account Section (`/account/*`):**
- ✅ **Shared layout** with sidebar navigation (Dashboard, Order History, Wishlist, Addresses, Settings)
- ✅ **Dashboard** (`/account`) — welcome message, total orders count, wishlist count, recent orders preview
- ✅ **Order History** (`/account/orders`) — full list of all orders with status badges, **fetched via server API route** (bypasses RLS)
- ✅ **Order Detail** (`/account/orders/[id]`) — items, status timeline (Placed → Processing → Shipped → Delivered), tracking number, shipping address, order summary, **download buttons for digital items**, **fetched via server API route**
- ✅ **Wishlist** (`/account/wishlist`) — persistent wishlist synced to database for logged-in users, localStorage fallback for guests, merges local items on login
- ✅ **Saved Addresses** (`/account/addresses`) — full CRUD, default address selection, label (Home/Work/Other)
- ✅ **Account Settings** (`/account/settings`) — profile info (name, phone), email change, password change (hidden for Google OAuth users)
- ✅ **Sign Out** — clears session, redirects to home

**Shipping & Trust Signals:**
- ✅ **Scrolling ticker banner** — seamless loop (4 copies, -25% translate keyframe), title case text: "Fast 2–5 Day US Delivery", "Free Shipping on $50+", "6,000+ Five-Star Reviews", "100% Secure Checkout" (fixed Session 34)
- ✅ **All shipping times updated** from 3-7 to 2-5 business days across entire codebase (including Stripe checkout)
- ✅ **Green shipping badge** on product detail pages (US warehouse products only)
- ✅ **Violet "Instant Digital Download" badge** on digital product pages
- ✅ **"Delivered in 2-5 days"** subtle line on product cards with truck icon (changed from "Ships in" Session 16)
- ✅ **Cart reassurance banner** — green banner for physical products, violet for digital
- ✅ **Cart trust badges** — compact horizontal layout (Free Shipping $50+, Secure Checkout, Easy Returns, Safe Payment)
- ✅ **Homepage value props** updated with "Fast US Shipping" messaging
- ✅ **Free shipping $50+ threshold enforced in checkout** — applies to all orders including CN warehouse; cart summary shows "FREE" in green when met, "Add $X.XX more" hint when under (Session 44)
- ✅ **"Free International Shipping"** label shown at Stripe checkout for CN orders when $50+ threshold met (Session 44)

**Navigation & Discovery:**
- ✅ Visual mega menu — full-width, 12 categories (no product counts), 3 product previews on right
- ✅ Live search with 300ms debounce, 6 product suggestions with thumbnails, **popular searches when empty** (Session 34)
- ✅ **Popular searches dropdown** — 12 curated terms shown when input is empty; category pills removed (Session 34)
- ✅ **"Searches related to" pills** — query modifier suggestions (kit, pen, set, for women) shown below product results; only appears when query ≥ 2 chars and results exist (Session 34)
- ✅ "You May Also Like" on product pages (4 same-category products)
- ✅ Sticky add-to-cart bar on mobile
- ✅ Infinite scroll pagination (24 products per load, IntersectionObserver with 200px rootMargin preload, skeleton loading states)
- ✅ Optimized API payload — only card-essential fields selected, variants stripped, images trimmed to 1, skip count on page 2+
- ✅ **Deterministic product sorting** — tiebreaker sort by id prevents pagination jumps
- ✅ Subcategory tag filters on category pages (centralized in `lib/config/subcategory-tags.ts`, word-boundary regex matching)
- ✅ 4-column product grid on desktop (max-w-[1600px]), 2-column on mobile
- ✅ Product card lazy loading with explicit width/height to prevent layout shift
- ✅ **Shop filter URL persistence** — filter/sort state synced to URL query params, browser back button restores filters
- ✅ **Category description collapse** — truncated to 120 chars with "Read more" toggle in gold; full text in DOM for SEO; extracted to `components/storefront/CategoryDescription.tsx` client component (Session 34)

**Storefront Pages:**
- ✅ Homepage: Split hero, **Featured This Week section** (full-width navy, two-column product spotlight, admin-configurable via mi_settings — Session 44), 12-category showcase (4×3 grid, name-only cards with images), best sellers carousel, **social proof stats section** (3,000+ Products, 39,000+ Reviews, 2-5 Days, 100% Secure with gold icons), value prop banner, new arrivals grid, deals grid with savings badges, newsletter signup, recently viewed
- ✅ Shop All with category/subcategory pill filters (12 categories), **URL-synced filters**
- ✅ Category pages with subcategory tags (12 categories)
- ✅ Trending page (sorted by review_count — most popular)
- ✅ Deals page (filtered by discount percentage)
- ✅ New Arrivals (sorted by created_at)
- ✅ Product detail with image gallery (lightbox, dedup, keyboard nav), variant selectors, color-image switching, DescriptionFormatter (strips CJ marketing, converts ALL CAPS, accordion specs), reviews, **digital product detection**
- ✅ **Guest order lookup** (`/order/lookup`) — find orders by order number + email

**Policy & Info Pages:**
- ✅ About Us (`/about`)
- ✅ Shipping Policy (`/shipping-policy`)
- ✅ Returns & Refunds (`/returns`)
- ✅ FAQ with accordion (`/faq`)
- ✅ Contact Us with form UI (`/contact`)
- ✅ Privacy Policy (`/privacy-policy`)
- ✅ Terms of Service (`/terms`)

**SEO (NEW — Feb 24):**
- ✅ **Google Search Console** — domain verified via DNS TXT record
- ✅ **Dynamic sitemap** (`app/sitemap.ts`) — queries Supabase for all active products, categories, static pages
- ✅ **robots.txt** (`app/robots.ts`) — allows all crawlers, disallows /admin /api /auth /account
- ✅ **Sitemap submitted** — 3,073 pages discovered by Google
- ✅ **Homepage indexed** — confirmed "Page is indexed" in Search Console
- ✅ **metadataBase** set to `https://www.mooreitems.com` in app/layout.tsx

**Analytics (NEW — Feb 24-25):**
- ✅ **Google Analytics GA4** — Measurement ID: `G-23H54T894J`
- ✅ **Stream:** MooreItems Web (https://www.mooreitems.com)
- ✅ **Enhanced measurement ON** — page views, scrolls, outbound clicks, site search, form interactions
- ✅ **Tracking script** — `next/script` with `afterInteractive` strategy in app/layout.tsx
- ✅ **Realtime data confirmed** — active users visible in GA4 dashboard

**Design & UI:**
- ✅ SVG favicon (gold "M" on navy circle)
- ✅ Animated scrolling ticker banner (replaced static announcement bar)
- ✅ Footer: 4-column navy layout, all 12 category links + policy links, payment icons, "Powered by Ai-genda.com"
- ✅ Mobile responsive: hamburger menu drawer (12 categories), bottom sheet filters, full-screen assistant, accordion footer, proper touch targets, **full mobile UX audit completed (Session 44)** — 44px touch targets, safe-area padding, overflow-x fixes, constrained images, swipe hints
- ✅ Product badges removed (no NEW/SALE/US SHIP overlays — cleaner look)
- ✅ Image gallery with lightbox (fullscreen, keyboard arrows, Escape close, image counter)
- ✅ Category images compressed (all 12 at ~100-270KB each, down from 6-9MB originals)

**Email System:**
- ✅ SendGrid integration (free tier: 100 emails/day)
- ✅ Order confirmation email template (V5 full-bleed layout)
- ✅ **Digital product download links** in confirmation emails (HMAC token-secured)
- ✅ **Conditional shipping section** — hidden for all-digital orders
- ✅ **"Digital Download" badges** next to digital item names in emails
- ✅ Stripe webhook triggers order confirmation emails
- ✅ **Abandoned cart email** — triggered by Stripe `checkout.session.expired` webhook (24hr after session creation)
- ✅ **Contact form email delivery** — `app/api/contact/route.ts` built (Session 26); admin notification with Reply-To customer email + customer auto-reply; both templates use navy/gold MooreItems styling
- ✅ **Abandoned cart template** — product images, names, SAVE10 discount code (10% off), CTA to /cart
- ✅ **Health check alert email** — branded template sent when daily health check finds issues, includes health score, auto-fixed counts, flagged issue details with product names, CTA to admin dashboard (Session 15)
- ✅ **Admin new-order alert** — sends email to mooreitemsshop@gmail.com when new order placed, includes order details, items, total, "Fund This Order in CJ" button
- ✅ Supabase SMTP configured through SendGrid (auth emails: signup confirmation, password reset)
- ✅ MooreItems-branded email templates (navy/gold design, "Powered by Ai-genda.com")
- ✅ Database columns: `email_sent_at`, `shipping_email_sent_at` on mi_orders
- ⚠️ **Emails going to spam** — normal for new sender, improves with sending volume and reputation
- ⚠️ **SendGrid free tier delay** — ~7 minute delivery delay, improves with sender reputation

**Order Pipeline (Updated Session 44):**
- ✅ Stripe webhook → order status update → smart fulfillment routing
- ✅ **CJ products** → CJ createOrderV2 (USPS+ for US, CJPacket Ordinary for CN)
- ✅ **Digital products** → instant delivery (fulfillment_status: 'delivered')
- ✅ **Mixed orders** → CJ items fulfilled, digital items delivered, note added
- ✅ **Webhook backup** — confirmation page updates payment status from Stripe if webhook missed
- ✅ Tracking sync script (`scripts/check-tracking.js`)
- ✅ Combined admin verify endpoint (product info + stock in one call)
- ✅ CJ auth token cached in globalThis (survives Next.js hot reloads)
- ✅ **CJ pay-per-order** — PayPal/credit card at CJ checkout, no wallet pre-funding needed
- ✅ **Phone number collection** — Stripe checkout collects phone, passed to CJ for shipping accuracy (Session 13)
- ✅ **Abandoned cart webhook** — `checkout.session.expired` event triggers recovery email after 24hr (Session 13)
- ✅ **Debug logging** — CJ API payloads and responses logged in fulfill-order.ts (Session 13)
- ✅ **Pipeline validated end-to-end** — Stripe → CJ → manual payment → shipping confirmed (Session 13)
- ✅ **CJ stock validation at checkout** — verifies CJ product availability before creating Stripe session, blocks delisted products (Session 15)
- ✅ **Variant required everywhere** — first available variant auto-selected on page load, inline error blocks add-to-cart without variant, server-side guard rejects orders without variant_id (Session 44)
- ✅ **variant_info saved** — color · size written to mi_order_items at checkout for order tracking (Session 44)
- ✅ **Order email race condition fixed** — 3-attempt retry loop with 2s delays for Supabase eventual consistency (Session 44)
- ✅ **Fulfillment race condition fixed** — same retry loop added to fulfill-order.ts (Session 44)
- ✅ **Failed fulfillment surfaced** — fulfillment_status set to 'failed' (not just logged), admin Failed tab with red badge + retry button (Session 44)
- ✅ **Stripe test mode safe** — CJ fulfillment and emails skipped when event.livemode===false (Session 44)
- ✅ **CJPacket Ordinary** — confirmed CN→US shipping method; CJ default shipping rule configured (Cost Priority, CJPacket Ordinary) (Session 44)

**Performance Optimizations:**
- ✅ **AuthProvider** — single `getUser()` + `mi_customers` fetch, shared via React Context (was 4+ duplicate calls)
- ✅ **CategoriesProvider** — single categories fetch, shared via React Context (was 6+ duplicate calls)
- ✅ **WishlistProvider** — fetches all wishlisted IDs in one query, stores as Set for O(1) lookups (was per-card queries)
- ✅ **Slim API queries** — product listing only selects card-essential fields (no description, no heavy fields)
- ✅ **Batch size 24** — down from 40, fits 4-col (6 rows) and 2-col (12 rows) grids perfectly
- ✅ **Skeleton loading states** — 8 placeholder cards while next batch loads
- ✅ **200px rootMargin preload** — starts fetching before user reaches bottom
- ✅ **Product card lazy loading** — `loading="lazy"` with explicit dimensions
- ✅ **Category images compressed** — 80MB → 1.7MB total (sharp, max-width 1200px, JPEG quality 80)

**Admin Product Edit Overhaul (Sessions 38–41):**
- ✅ **Unified Media Gallery** — images + videos in a single drag-and-drop grid (native HTML5 drag API, no library). 240×240px square cards, visual feedback (opacity/scale/gold ring on drop target), image lightbox, video preview modal
- ✅ **Cloudflare Stream direct upload** — browser uploads video directly to Cloudflare via one-time `uploadURL`, bypassing Netlify's 6MB serverless limit. XHR progress tracking in UI
- ✅ **Direct browser-to-Supabase image upload** — product images and variant images upload from browser to Supabase Storage, bypassing API routes entirely
- ✅ **Image swatches** — variant color swatches on product cards and product page, driven by variant `image_url`
- ✅ **CJ/factory stock split columns** — admin product edit shows CJ stock and factory stock separately with live refresh
- ✅ **Products list page improvements** — full-width table, default Active filter, server-side Source filter (CJ/AliExpress/Digital/Manual), price min/max filter, larger thumbnails, truncated product names
- ✅ **Storefront gallery fixes** — consistent aspect-square container for image/video, object-cover on main image and thumbnails, active-only variant images in gallery
- ✅ **View on Storefront button** — product edit page links directly to live product page

**Security (Session 30 — Full Audit):**
- ✅ **CJ webhook secret validation** — `timingSafeEqual` check on `CJ_WEBHOOK_SECRET` query param; rejects all unsigned requests with 401; URL-safe hex secret; webhooks re-registered with correct CJ API format
- ✅ **scripts/register-cj-webhooks.js** — New script; reads `CJ_API_KEY` + `CJ_WEBHOOK_SECRET` from `.env.local`, fetches fresh token, registers all 4 webhook topics (stock, product, logistics, order) in single call to `/v1/webhook/set`
- ✅ **AI assistant rate limiting** — 10 req/IP/min via native Map (no external deps); returns 429 with user-friendly message
- ✅ **Checkout rate limiting** — 5 req/IP/10min; prevents promo code enumeration and CJ API drain
- ✅ **Contact form rate limiting** — 3 req/IP/hour; prevents SendGrid free tier exhaustion
- ✅ **PII logging gated** — `lib/cj/fulfill-order.ts` full shipping payload log now behind `FULFILL_DEBUG=true`; not set in Netlify production
- ✅ **Admin API auth audit** — All 33 `/api/admin/*` routes independently verified; all use `requireAdmin()` or dual-mode `checkAuth()` before any logic
- ✅ **HTTP security headers** — `netlify.toml` now sets X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy on all routes
- ✅ **Cost columns removed from public API** — `app/api/products/[slug]/route.ts` replaced `select('*')` with explicit safe column list; `cj_raw_data`, `cj_price`, `margin_dollars`, `margin_percent`, `shipping_cost`, `stripe_fee`, `total_cost` no longer returned to clients
- ✅ **Guest order lookup hardened** — Identical 404 response whether email doesn't exist or order number doesn't match; eliminates customer existence oracle
- ✅ **HMAC_SECRET in Netlify** — Added; digital download tokens are now properly signed (was missing — tokens would have used empty string as secret)
- ✅ **Stripe webhook verified** — `constructEvent()` confirmed called before all order processing; immediate 400 on signature failure
- ✅ **No secrets in NEXT_PUBLIC_ vars** — All 20 Netlify env vars audited; only publishable/anon keys are public-prefixed
- ✅ **mi_settings RLS fixed** — Was `to public, using (true)` (anyone with anon key could read CJ token + pricing config); fixed to `service_role` full access + `authenticated + mi_admin_profiles` read-only policy

### What's NOT Built Yet
- ~~❌ **Daily CJ stock/price sync automation**~~ ✅ RESOLVED (real-time CJ webhook system — STOCK/VARIANT/LOGISTICS/PRODUCT events, Sessions 18 + 23)
- ~~❌ CJ webhook handler (push notifications)~~ ✅ RESOLVED (Session 18)
- ~~❌ Per-variant stock accuracy~~ ✅ RESOLVED (Session 23 — `buildVariantStockMap` reads `variantInventories` per-variant)
- ~~❌ Discontinued product auto-hide via webhook~~ ✅ RESOLVED (Session 23 — PRODUCT webhook handler added)
- ~~❌ Stock sync cron job~~ ✅ RESOLVED (Session 23 — cron-job.org at 4AM daily)
- ✅ **Cookie consent / GDPR banner** — `components/CookieConsent.tsx`, Meta Pixel gated behind consent (Session 27)
- ✅ **Admin refund workflow** — Stripe refund button in orders, `app/api/admin/orders/refund/route.ts`, refund columns on `mi_orders` (Session 27)
- ⏳ **Stripe Tax** — Florida registration submitted (confirmation #249-6800-6526), awaiting certificate number email; once received add to Stripe Tax → Registrations
- ❌ **Meta Ads first campaigns** — everything ready (Pixel, Business Portfolio, social profiles), just needs execution
- ~~❌ Landing page builder (admin feature)~~ ✅ RESOLVED (Session 32 — AI-generated landing pages with admin builder, public /lp/[slug] pages)
- ❌ Ad campaign manager (admin feature)
- ❌ Blog/content section (Phase 4 SEO — long-term content play)
- ❌ Unified import pipeline (spec written in Session 15 — replaces 9-script sequence with single command, **use AI categorization not keywords**)
- ⏳ **Raise blender retail price** — currently priced too low relative to cost
- ~~⏳ **Fix White Pink variant**~~ ✅ RESOLVED (Session 44 — White Pink bundle, 2pcs White, 2pcs Pink, Pink/White Simple Packaging, Blue 380ml, Blue 420ml variants deactivated; only White, Pink, Black single-unit variants remain active)
- ⏳ **Health check summary email** — daily catalog health script should email results instead of just logging
- ~~⏳ **Free shipping threshold**~~ ✅ RESOLVED (Session 44 — $50+ subtotal threshold enforced in checkout route for all orders including CN; cart summary shows "FREE" in green when met, "Add $X.XX more" hint when under)
- ⏳ **More product videos** — expand Cloudflare Stream video coverage across catalog

---

## Business Strategy

### The Model

Three revenue streams operating simultaneously on one domain:

**1. Evergreen Catalog Store**
- ~2,900 curated US warehouse products across 12 categories
- 2-5 day shipping from US warehouses (competitive with Amazon)
- 40%+ profit margins on every product
- AI Shopping Assistant for personalized product discovery
- Builds SEO over time, catches organic traffic (SEO clock started Feb 24, 2026)
- Products sit and cost nothing — only fulfilled when orders come in

**2. Trending Product Ad Funnel**
- Spot trending products on TikTok, social media, trend tools
- Generate ad creatives using Gemini (images) and Higgsfield (video)
- Create niche-specific landing pages on MooreItems.com
- Run Meta/IG ads at $5-20/day per test
- If it converts, scale. If not, kill the ad and move on
- Landing pages drive traffic to the broader store for cross-sells

**3. Digital Products**
- PLR/MRR content, downloadable PDFs, educational materials
- **100% margin** — zero shipping, zero COGS after first purchase
- Instant delivery → higher customer satisfaction
- No CJ dependency → no fulfillment failures
- Can be bundled with physical products
- First product: Kids Printable Activity Bundle ($4.99)

### Why This Beats Shopify

| Cost | Shopify | MooreItems Custom |
|------|---------|-------------------|
| Platform fee | $39/mo | $0 |
| Bundle app | $10-15/mo | Built-in (free) |
| Email app | $10/mo | SendGrid free tier |
| Reviews app | $10/mo | Custom built (free) |
| AI Assistant | $20-50/mo | Built-in (Anthropic API) |
| Digital delivery | $10-20/mo | Custom built (free) |
| Misc plugins | $20-30/mo | Custom built (free) |
| **Total monthly** | **$120-175/mo** | **~$5/mo (API usage)** |
| **Annual overhead** | **$1,440-2,100** | **~$60** |

All savings redirected into Meta ad spend — the only thing that actually generates revenue.

### Ad Budget Strategy

- Starting budget: $20/day
- At ~$1.25 avg CPC, that's roughly 16 clicks/day
- Test 3-4 niches at $5/day each simultaneously
- Double down on winners, kill losers within 1 week
- Need products with $30+ AOV so one sale covers daily ad spend
- Products should demo well in short video for best Meta performance

---

## Tech Stack

### Existing Infrastructure (Already Paid For)

| Service | Plan | Use |
|---------|------|-----|
| Netlify | Paid | Frontend hosting, CDN, SSL — **mooreitems.com LIVE** |
| Supabase | Paid (shared with Ai-genda) | Database, auth, storage (incl. digital products bucket), edge functions |
| Stripe | Per-transaction — **LIVE MODE** | Payment processing |
| Anthropic API | Per-token | AI Shopping Assistant (claude-sonnet-4-20250514), Review Generation + Polish (claude-haiku-4-5) |
| SendGrid | Free tier | Transactional + auth emails via SMTP |
| Google Analytics | Free (GA4) | Traffic tracking — **Measurement ID: G-23H54T894J** |
| Google Search Console | Free | SEO monitoring — **3,073 pages indexed** |
| Meta Pixel | Free | Conversion tracking — **ID: 2064810427703961**, PageView/ViewContent/AddToCart/Purchase |
| Meta Business Portfolio | Free | "MooreItems" — ad account, pixel management |
| Google Merchant Center | Free | **~2,840 products under review** — daily feed fetch from `/api/feeds/google-merchant`, shipping/returns fully configured (Session 16) |
| cron-job.org | Free | Automated tracking sync every 4 hours + daily catalog health check at 3 AM + **auto-import suggest via Netlify scheduled function at 2 AM** |
| Gemini | Available | AI image generation for ad creatives |
| Higgsfield | Available | AI video generation for ad creatives |

### Services to Integrate

| Service | Cost | Use |
|---------|------|-----|
| CJ Dropshipping | Free (API) | Product sourcing, order fulfillment, shipping — **pay-per-order with PayPal/card**, **real-time stock sync via webhooks** (Session 18) |
| n8n | Self-hosted or cloud | Workflow automation (order pipeline, sync, emails) |
| Meta Ads | Ad budget only | Customer acquisition |

### Build Tools

- **Bolt** — built the initial storefront and admin UI (Phase 2)
- **Cursor** — backend integration, API routes, database wiring, storefront polish (Phase 3+)
- **Claude Code** — terminal-based AI development (Phase 9+, direct file access, command execution)
- **Claude** — architecture, prompts, debugging, project management
- **React / Next.js 13.5.1** — frontend framework (App Router)
- **Tailwind CSS** — styling
- **Supabase** — database, auth, storage, real-time subscriptions
- **@supabase/ssr** — server-side auth (replaces @supabase/auth-helpers-nextjs)
- **Stripe** — payment processing (hosted Checkout Sessions)
- **@anthropic-ai/sdk** — AI Shopping Assistant + Review Generation + Polish backend
- **sharp** — image compression (dev dependency)
- **ts-node** — TypeScript execution for scripts (dev dependency)
- **xlsx** — Excel export for product data (dev dependency)
- **n8n** — workflow automation engine (future)
- **react-icons** — official brand icons for social media links (Instagram, Facebook, TikTok, LinkedIn)

### Development Environment

- **Machine:** Windows PC
- **Project Path:** `C:\Websites\MooreItems\project`
- **Node/NPM:** Standard install (Node v22)
- **Dev Server:** `npm run dev` → http://localhost:3000 (run in separate PowerShell window)
- **Claude Code:** `cd C:\Websites\MooreItems\project && claude` (run in separate PowerShell window)
- **Production Site:** https://www.mooreitems.com
- **Admin Access:** http://localhost:3000/admin (requires admin auth)
- **Admin Pricing:** http://localhost:3000/admin/pricing
- **Catalog Health:** http://localhost:3000/admin/catalog-health
- **Add Product:** http://localhost:3000/admin/products/add
- **Edit Product:** http://localhost:3000/admin/products/edit/[id]
- **Customer Account:** http://localhost:3000/account (requires customer auth)
- **Guest Order Lookup:** http://localhost:3000/order/lookup
- **Stripe CLI:** `stripe listen --forward-to localhost:3000/api/webhooks/stripe` (run in third PowerShell window)

### Development Workflow (3 PowerShell Windows)
1. **Window 1:** Claude Code (`claude`) — AI development, file editing, builds
2. **Window 2:** Dev server (`npm run dev`) — runs the site locally
3. **Window 3:** Stripe CLI (`stripe listen --forward-to localhost:3000/api/webhooks/stripe`) — webhook forwarding for payment testing

### Deployment Workflow
1. Make changes locally (Cursor or Claude Code)
2. `git add . && git commit -m "description" && git push`
3. Netlify auto-deploys from GitHub `main` branch
4. Database changes (product edits, prices, etc.) are instant — shared Supabase, no deploy needed

---

## Stripe Configuration

### Account Details
- **Account:** MooreItems business (under same Stripe login as ai-genda)
- **Mode:** **LIVE MODE** (production payments active)
- **Dashboard:** https://dashboard.stripe.com
- **Production Webhook:** `https://mooreitems.com/api/webhooks/stripe` (events: `checkout.session.completed`, `checkout.session.expired`)
- **Local Webhook:** Stripe CLI forwarding for dev testing

### Environment Variables (Production — Netlify)
```
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (production signing secret)
```

### Environment Variables (Local — .env.local)
```
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (Stripe CLI signing secret)
```

### Checkout Flow
1. Customer adds items to cart (React Context + localStorage)
2. Cart page validates discount codes against `mi_discount_codes`
3. Cart detects digital vs physical items, shows appropriate shipping/delivery messaging
4. "Proceed to Checkout" calls `POST /api/checkout` which:
   - Validates products server-side (prices, stock, status)
   - **Validates CJ product availability** — calls CJ inventory API, blocks checkout if product delisted (Session 15)
   - Calculates shipping based on warehouse (US/CN) — **$0 for all-digital carts**
   - **Skips shipping_address_collection for all-digital carts**
   - **Collects phone number** via `phone_number_collection: { enabled: true }`
   - Creates preliminary order in `mi_orders` (fulfillment_status: 'unfulfilled')
   - Creates Stripe Checkout Session with line items
   - Shipping estimate: "2-5 business days"
   - Returns Stripe URL for redirect
5. Customer pays on Stripe's hosted page
6. Stripe webhook fires `checkout.session.completed`
7. Webhook handler:
   - Updates order: payment_status → 'paid'
   - **Digital orders:** fulfillment_status → 'delivered', generates download tokens
   - **CJ orders:** fulfillment_status → 'processing', triggers CJ order creation
   - **Mixed orders:** fulfills CJ items, notes digital items as delivered
8. SendGrid order confirmation email sent (with download links for digital items)
9. Customer redirected to `/order/confirmation?session_id=cs_...`
10. **Backup:** Confirmation page checks Stripe directly and updates order if webhook missed

### First Live Transaction (Feb 24)
- $8.99 necklace + $4.99 shipping = $13.98
- Stripe payment succeeded, webhook delivered, confirmation email sent
- CJ fulfillment failed (expected — $0 balance)
- Order refunded via Stripe dashboard

### First Successful Revenue Order (Feb 26 — Session 13)
- Order MI-1772146672690-4WGL6H
- Customer payment: $14.33 (Stripe)
- CJ fulfillment cost: $6.43 (paid manually in CJ dashboard with credit card)
- Stripe fee: ~$0.72
- Net profit: ~$7.18 (~50% margin)
- Status: Paid and submitted to CJ for shipping

### Test Card (for local dev only)
- Number: `4242 4242 4242 4242`
- Expiry: any future date
- CVC: any 3 digits
- ZIP: any valid zip

---

## Design System

### Brand: MooreItems

- **Positioning:** A curated general marketplace — "More items, Moore value"
- **Tone:** Clean, trustworthy, modern — NOT a cheap dropship vibe (Nordstrom meets Target)
- **Cross-branding:** "Powered by Ai-genda.com" in shopping assistant header + site footer

### Color Palette

**Primary (Dark — header, footer, hero)**
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

**Shipping/Trust (green accents)**
- Green badge bg: `green-50`
- Green badge border: `green-200`
- Green text: `green-600` / `green-800`

**Digital Product (violet accents)**
- Violet badge bg: `violet-50`
- Violet text: `violet-600` / `violet-700`
- Purple accent: `purple-600` (Generate Reviews button, Polish button)

**Admin Dashboard (Light Theme)**
- Background: `#f8f9fb`
- Cards: `#ffffff` with `border-gray-200` and `shadow-sm`
- Sidebar: `#ffffff` with right border

### Typography
- **Display/Headings:** Playfair Display
- **Body:** DM Sans

### Favicon
- SVG: gold `#c8a45e` letter "M" on navy `#0f1629` circle
- Location: `public/favicon.svg`
- Wired in `app/layout.tsx` metadata

---

## Supabase Configuration

### Project Details
- **Project URL:** https://vjiybpiuquttbaimywbt.supabase.co
- **Custom Auth Domain:** `auth.mooreitems.com` (CNAME + TXT verified)
- **Shared Project:** Also used by Ai-genda (MooreItems tables use `mi_` prefix)
- **Admin User ID:** 24a9cd8a-acd3-4312-b467-75e332c8bd2f
- **Admin Email:** mooreitemsshop@gmail.com
- **Admin Role:** super_admin
- **Site URL:** `https://www.mooreitems.com` (updated from localhost for production)

### Storage Buckets
- **digital-products** — Private bucket for digital product files (PDFs). Files uploaded with UUID-prefixed filenames to prevent collisions. Access only via signed URLs generated by the download API.
- **landing-page-images** (25MB limit) — Product images. Uploaded directly from browser via `createBrowserClient`. Path: `products/${productId}/${uuid}-${filename}`.
- **gallery-photos** (50MB limit) — Variant images. Uploaded directly from browser via `createBrowserClient`. Path: `variants/${variantId}/${uuid}-${filename}`.

### Auth Configuration
- **Email provider:** Enabled with email confirmation
- **Google OAuth:** Enabled (MooreItems Google Cloud project, published app)
  - Authorized JS origins: `https://mooreitems.com`, `https://www.mooreitems.com`
  - Redirect URI: `https://auth.mooreitems.com/callback`
- **SMTP:** SendGrid (`smtp.sendgrid.net:587`, username: `apikey`)
- **Confirmation email template:** MooreItems branded (navy/gold)
- **Redirect URLs:** `http://localhost:3000/auth/callback`, `https://mooreitems.com/auth/callback`, `https://www.mooreitems.com/auth/callback`

### Database Trigger
```sql
-- Auto-creates mi_customers row on any signup (email or Google)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.mi_customers (auth_user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Database Tables (all prefixed `mi_`)

| Table | Purpose |
|-------|---------|
| `mi_products` | Product catalog (~3,019 active physical + digital products) |
| `mi_product_variants` | Sizes, colors, SKUs per product |
| `mi_categories` | **13 store categories** (12 physical + Digital Downloads) with product_count, **description** (SEO text), **faq_json** (FAQ items) |
| `mi_orders` | Customer orders (Stripe + CJ tracking) — RLS enabled. Columns include `refund_status`, `refunded_at`, `stripe_refund_id` (added Session 27) |
| `mi_order_items` | Line items per order — RLS enabled |
| `mi_carts` | Shopping carts (for abandoned cart recovery) |
| `mi_reviews` | Customer reviews — 39,534+ AI-generated (source='generated') + real customer reviews (source='customer', verified_purchase=true). Key columns: `rating`, `body`, `customer_name`, `is_approved`, `verified_purchase`, `reviewer_email`, `order_id`, `status` (verified_purchase/reviewer_email/order_id/status added Session 31) |
| `mi_landing_pages` | Niche landing pages for ad campaigns |
| `mi_discount_codes` | Promo codes (MOORE50, WELCOME15, WELCOME10, SAVE10 seeded) |
| `mi_wishlists` | Customer saved items — RLS enabled, synced to DB for logged-in users |
| `mi_customers` | Customer profiles (auth_user_id, email, full_name, phone) — RLS enabled |
| `mi_customer_addresses` | Saved shipping addresses — RLS enabled |
| `mi_analytics_events` | Page views, add-to-cart, purchases |
| `mi_admin_profiles` | Admin users extending auth.users |
| `mi_settings` | Persistent key-value store — CJ token cache (`cj_token`), pricing config (`pricing_config`), featured product (`featured_product_id`), GA4 service account key (`ga4_service_account_key`) |
| `mi_category_pricing` | Per-category pricing rules — min_price, target_margin, markup_override per category slug |

### RLS Policies Summary

**mi_customers:** SELECT/UPDATE/INSERT — own row only (auth.uid() = auth_user_id)
**mi_orders:** SELECT — own orders only (email matches auth user email) — **NOTE: order history pages bypass RLS via server API routes using admin client**
**mi_order_items:** SELECT — own order items only (order_id in own orders)
**mi_wishlists:** SELECT/INSERT/UPDATE/DELETE — own items only (customer_id in own mi_customers)
**mi_customer_addresses:** SELECT/INSERT/UPDATE/DELETE — own addresses only (customer_id in own mi_customers)

### Key Column Names

**mi_products:**
- `hero_eligible` — boolean (true if primary image passed AI vision quality check; default false)
- `hero_checked_at` — timestamptz (set when image was evaluated; NULL = not yet checked; used to prevent re-processing)
- `cj_pid` — CJ product ID (null for manual/digital products)
- `digital_file_path` — Supabase Storage object path for digital products
- `warehouse` — 'US' or 'CN' (null for digital)
- `shipping_estimate` — '2-5 business days' or 'Instant delivery'
- `available_warehouses` — jsonb array
- `review_count` — integer (varies 1-35)
- `average_rating` — numeric (4.0-5.0 range)
- `stock_count` — integer (100 for physical, 9999 for digital)
- `status` — 'active', 'hidden', 'pending'
- `compare_at_price` — 1.8-2.2x retail_price multiplier
- `images` — jsonb array of image URLs
- `cj_price` — CJ wholesale price (0 for manual/digital)
- `shipping_cost`, `stripe_fee`, `total_cost`, `markup_multiplier` — pricing breakdown columns
- `margin_dollars`, `margin_percent` — profit tracking
- `rating` — product rating
- `cj_raw_data` — jsonb, full CJ API response (includes `productWeight` and `packingWeight` for enriched products)

**mi_orders:**
- `email` — customer email (set at checkout for order matching) — **NOTE: `customer_email` column is always null; use `email` for purchase verification**
- `email_sent_at` — timestamp when order confirmation sent
- `shipping_email_sent_at` — timestamp when shipping notification sent

**mi_reviews:**
- `rating` — integer 1-5 (star rating column name)
- `body` — text (review text column name)
- `customer_name` — text (reviewer name column name)
- `source` — 'generated', 'ai-generated', or 'customer'
- `is_approved` — boolean (existing column, used by display queries)
- `verified_purchase` — boolean (added Session 31, true for real customer reviews)
- `reviewer_email` — text (added Session 31, used for purchase verification + duplicate check)
- `order_id` — text (added Session 31, references the verified purchase order)
- `status` — text (added Session 31, 'approved'/'pending'/'rejected' — set alongside is_approved)

**mi_customers:**
- `auth_user_id` — references auth.users(id), UNIQUE
- `email`, `full_name`, `phone`
- `default_shipping_address` — jsonb

**mi_customer_addresses:**
- `customer_id` — references mi_customers(id)
- `label` — 'Home', 'Work', 'Other'
- `name`, `line1`, `line2`, `city`, `state`, `postal_code`, `country`
- `is_default` — boolean

**mi_wishlists:**
- `customer_id` — references mi_customers(id) ON DELETE CASCADE
- `product_id` — references mi_products(id) ON DELETE CASCADE
- Unique constraint on (customer_id, product_id)

### Category Breakdown (Mar 3 — Post-Session 20 CN Expansion)
1. Home & Furniture — 669 (659 US + 10 CN)
2. Fashion — 589 (582 US + 7 CN)
3. Jewelry — 303 (269 US + 34 CN)
4. Health & Beauty — 286 (279 US + 7 CN)
5. Garden & Outdoor — 217
6. Kitchen & Dining — 151 (147 US + 4 CN)
7. Pet Supplies — 127 (125 US + 2 CN)
8. Kids & Toys — 111 (107 US + 4 CN)
9. Storage & Organization — 94 (93 US + 1 CN)
10. Sports & Outdoors — 91
11. Tools & Hardware — 86
12. Electronics — 81 (76 US + 5 CN)
13. **Digital Downloads** (violet theme, sort_order: 99)

---

## CJ Dropshipping Integration

### Account Details
- **Account ID:** CJ5161322
- **Plan:** Free
- **API Base URL:** `https://developers.cjdropshipping.com/api2.0/v1`
- **Daily API Limit:** 5,000 requests/day (increased from default 1,000 — as of March 2026)

### Auth Token Caching (IMPORTANT)
- Token cached in `globalThis` to survive Next.js hot reloads
- 5-minute cooldown between auth requests
- 2-minute buffer before expiry triggers refresh
- Single auth covers all API calls until token expires (weeks)
- See `lib/cj/client.ts` for implementation
- ⚠️ **Token cache file** (`scripts/.cj-token-cache.json`) is in `.gitignore` — never commit

### Order Fulfillment
- Endpoint: `POST /shopping/order/createOrderV2`
- **Warehouse-aware routing (Session 20):**
  - US products: `fromCountryCode: 'US'`, `logisticName: 'USPS+'`, `wareHouseCountryCode: 'US'`
  - CN products: `fromCountryCode: 'CN'`, `logisticName: 'CJPacket Ordinary'`, `wareHouseCountryCode: 'CN'`
  - Mixed orders: each product specifies its own `wareHouseCountryCode` — CJ splits shipments automatically
- ✅ **Pay-per-order supported** — PayPal, credit card, Stripe, Klarna available at checkout (no wallet pre-funding needed)
- **Workflow:** API creates order in CJ → order appears in CJ dashboard → pay with credit card in dashboard → CJ ships
- **Phone number collected at Stripe checkout** and passed to CJ for shipping accuracy (Session 13)
- **Non-CJ products are automatically skipped** by smart fulfillment routing
- **CJ error 1603000** — "Order create fail", resolved by adding debug logging and fixing payload (Session 13)
- **CJ error 1604000** — "Balance insufficient", order still created in CJ dashboard, pay manually (Session 13)

### US Warehouse Detection (IMPORTANT)
- CJ product detail API (`/product/query`) does NOT include warehouse info (returns `sourceFrom: 0`)
- **Must call stock/inventory API** (`getProductStock`) to detect US warehouse availability
- Import route checks: `hasUSStock (from inventory API) || detectUSWarehouse (from product detail)`
- Without this, products default to CN warehouse incorrectly

### Weight Data
- CJ list API (`/product/listV2`) does NOT return weight data
- CJ detail API (`/product/query`) returns `productWeight` and `packingWeight` (in grams)
- **All 3,018 CJ products enriched** with weight data via `scripts/fetch-weights.js` (confirmed complete Session 15)
- Weight data stored in `cj_raw_data` jsonb column on `mi_products`
- **Note:** productWeight can be a range string like "1.00-912.00" for products with variant-dependent weights — use `parseFloat()` not `Number()` to parse

### Webhooks (Real-Time Stock Sync — Session 18)
- **Endpoint:** `https://mooreitems.com/api/webhooks/cj`
- **Registered types:** STOCK, PRODUCT, LOGISTICS (all enabled)
- **Registration script:** `scripts/register-cj-webhooks.js` (one-time setup)
- **CJ sends events for entire catalog** — most won't match store's ~3,000 products; non-matches silently dropped
- **Actual payload formats differ from CJ docs:**
  - STOCK: `{messageId, type: "STOCK", params: {VID: [{countryCode, storageNum, ...}]}}` — VID-keyed object
  - STOCK (empty): `{messageId, type: "STOCK", params: {VID: []}}` — stock cleared for all warehouses
  - VARIANT: `{messageId, type: "VARIANT", params: {vid, pid, variantStatus, variantSellPrice, ...}}` — flat object
- **Handler logic:**
  - STOCK with US warehouse data → update `mi_product_variants.stock_count` for US warehouse products
  - STOCK with CN warehouse data → update `mi_product_variants.stock_count` for CN warehouse products (NEW — Session 20)
  - STOCK with empty array → zero out matched variant, cascade to product `out_of_stock` if all depleted
  - VARIANT with `variantStatus: 0` → deactivate variant (is_active=false, stock_count=0)
  - VARIANT with `variantStatus: 1` → reactivate variant
- **Debug mode:** Set `CJ_WEBHOOK_DEBUG=true` env var to log raw payloads
- **⚠️ CJ auth rate limit:** 1 request per 300 seconds — wait 5 minutes between registration attempts

### Current Catalog Status
- **~2,510 active products** — ~2,439 US warehouse + ~71 CN warehouse (Session 20)
- **~212 hidden** (junk, wholesale listings, platform ban references, gibberish names, supplements, duplicates)
- All products enriched: images, descriptions, variants, categories
- **All products have variants** — 1,252 previously orphaned products fixed (Session 15)
- **All products have weight data** — 3,018/3,018 CJ US products confirmed; CN products have weight from CJ raw data
- CJ has 4,345 total US warehouse products — current US catalog is top ~3,200 by popularity
- **CN product import pipeline** — `import-cn-products.js` with AI categorization (Session 20)

---

## Pricing Engine

### Configuration (`lib/config/pricing.ts`)
Hardcoded constants remain as fallback. Actual runtime config loaded from `mi_settings` via `getPricingConfigFromDB()`.

```ts
// Fallback hardcoded config (used if DB unavailable)
export const PRICING_CONFIG = {
  markupMultiplier: 2.0,          // Fallback only — DB stores 1.6 for US
  minimumMargin: 0.40,            // Fallback only — DB stores 0.15 for US
  shippingCostEstimate: 3.00,
  stripeFeePercent: 0.029,
  stripeFeeFixed: 0.30,
  compareAtPriceMin: 1.3,
  compareAtPriceMax: 1.6,
  roundTo99: true,
}

// Two new async functions added in Session 24:
// getPricingConfigFromDB(supabase, warehouse) — reads mi_settings pricing_config, warehouse-aware
// getCategoryPricingRules(supabase) — reads mi_category_pricing, returns slug-keyed lookup
```

### Live Config (in mi_settings, key: 'pricing_config')
| Setting | US | CN |
|---|---|---|
| Markup | 1.6x | 1.8x |
| Min Margin | 15% | 20% |
| Shipping Estimate | $3.00 | $5.00 |
| Stripe Fee | 2.9% + $0.30 | same |
| Compare-At Range | 1.3x–1.6x | same |
| Round to .99 | Yes | Yes |

### How It Works
```
Per product:
1. Load warehouse-specific config from mi_settings (US or CN)
2. Look up category rule from mi_category_pricing (by category UUID → slug map)
3. Apply markup_override if set on category rule
4. Apply stricter of global vs category target_margin
5. (wholesale + shipping_estimate) × markupMultiplier = retail price (rounded to .99)
6. If retail < category min_price → floor to min_price, recalculate margin
7. Minimum margin check — skip product if still below threshold
8. compare_at_price = retail × random(1.3–1.6)
```

### Category Minimum Prices (mi_category_pricing)
| Category | Min Price | Target Margin |
|---|---|---|
| Jewelry | $9.99 | 20% |
| Electronics | $14.99 | 18% |
| Fashion | $9.99 | 18% |
| Home & Furniture | $12.99 | 15% |
| Health & Beauty | $6.99 | 18% |
| Kitchen & Dining | $9.99 | 15% |
| Garden & Outdoor | $12.99 | 15% |
| Kids & Toys | $7.99 | 18% |
| Pet Supplies | $6.99 | 18% |
| Sports & Outdoors | $9.99 | 15% |
| Storage & Organization | $7.99 | 15% |
| Tools & Hardware | $9.99 | 15% |

### How to Change Prices
1. **Via Admin UI:** Go to `/admin/pricing`, adjust values, click Save, then "Reprice All Products"
2. **Settings persist** — saved to `mi_settings` and `mi_category_pricing` in Supabase
3. **Live Preview:** Admin pricing page calculates retail/margin client-side from current form state

**Note:** Repricing skips manual/digital products (cj_price = 0). Digital products ARE subject to category min price floors currently (known issue — Kids Printable Activity Bundle at $7.99 instead of original $4.99).

**Auto-Reprice (Session 43):** Stock sync background function now auto-corrects CJ cost drift <25% using `CEIL((new_cj_price + COALESCE(shipping_cost, 3.00)) * 2.0) - 0.01`. Drift >=25% is flagged for manual review with `recommendedPrice` in `price_drift_details`.

### Shipping Cost Calculation (Customer-Facing)
```
US warehouse: Weight-based tiers ($4.99-$29.99) or CJ real-time quote
CN warehouse: Weight-based tiers (same system, different config possible)
Digital products: $0 (free)
Free shipping over $50 subtotal (US), configurable per warehouse
```

---

## Digital Products System

### Architecture
```
Upload: Admin form → /api/admin/products/upload-digital → Supabase Storage (digital-products bucket)
Detection: isDigital() checks digital_file_path OR category slug OR manual product fingerprint
Checkout: Skip shipping for all-digital carts, $0 shipping cost
Payment: Webhook → fulfillment_status: 'delivered' immediately
Download: /api/downloads/[orderId]/[itemId] → signed URL (1hr expiry) → browser redirect
Security: HMAC-SHA256 tokens for guest access, authenticated sessions for logged-in users
```

### Key Files
| File | Purpose |
|------|---------|
| `app/api/admin/products/upload-digital/route.ts` | File upload API (max 50MB, UUID-prefixed) |
| `app/api/downloads/[orderId]/[itemId]/route.ts` | Download API (signed URLs, auth + HMAC tokens) |
| `app/api/orders/lookup/route.ts` | Guest order lookup API |
| `app/order/lookup/page.tsx` | Guest order lookup page |
| `lib/download-token.ts` | HMAC-SHA256 token generation/verification |

### How to Add a Digital Product
1. Go to `/admin/products/add`
2. Select "Digital Downloads" category (auto-checks digital toggle, auto-sets status to active)
3. Upload PDF file
4. Set name, description, price
5. Click "Create Product"
6. Optionally generate reviews via preview modal

---

## Standalone Scripts

> **Session 24 Cleanup:** Removed 21 one-time/deprecated scripts. All keyword-based categorization scripts retired — AI categorization is the standard. All one-time data fixes (orphaned variants, weights, descriptions, webhooks registration) are done and pipeline-hardened. Only ongoing-use scripts remain.

### Import & Enrichment Pipeline

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/import-us-products.js` | Import US warehouse products from CJ | `node scripts/import-us-products.js 1 10` (pages 1-10) |
| `scripts/import-cn-products.js` | Import CN warehouse products — 2.2x markup, 45% min margin, $5 shipping estimate, 7-15 day delivery | `node scripts/import-cn-products.js 1 5` (pages 1-5) |
| `scripts/enrich-us-products.js` | Pull full details (images, descriptions, variants) for imported products | `node scripts/enrich-us-products.js all` |
| `scripts/ai-categorize-remaining.js` | AI categorization via Claude Haiku — **standard for all imports** | `node scripts/ai-categorize-remaining.js --apply` |
| `scripts/ai-clean-names.js` | AI product name cleanup — strips shipping instructions, platform refs, specs | `node scripts/ai-clean-names.js --apply` |
| `scripts/fix-prices.js` | Reprice all products using `lib/config/pricing.ts` | `node scripts/fix-prices.js` |
| `scripts/generate-reviews-v3.js` | Generate positive reviews (4-5 stars, recent dates) | `node scripts/generate-reviews-v3.js` |
| `scripts/fetch-missing-images.js` | Enrich products that came in with only 1 image | `node scripts/fetch-missing-images.js` |

### Catalog Maintenance

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/bulk-polish.js` | Bulk AI polish — Claude Haiku rewrites names/descriptions, resumable with progress file | `node scripts/bulk-polish.js` |
| `scripts/cleanup-products-v2.js` | Periodic junk detection — deactivate junk, flag questionable products | `node scripts/cleanup-products-v2.js --dry-run` |
| `scripts/ai-category-audit.js` | AI category audit — validates categories, detects junk/duplicates, outputs hide/move recommendations | `node scripts/ai-category-audit.js` |
| `scripts/full-product-audit.js` | Comprehensive quality audit — categories, duplicates, junk, bad names, missing data | `node scripts/full-product-audit.js` |
| `scripts/category-audit.js` | Category-only audit with group-by pattern analysis — useful after large imports | `node scripts/category-audit.js` |
| `scripts/find-new-cj-pids.js` | Discover CJ products not yet in database | `node scripts/find-new-cj-pids.js` |
| `scripts/compress-images.js` | Compress category images (sharp, 1200px, quality 80) | `node scripts/compress-images.js` |

### Diagnostics & Debugging

| Script | Purpose | Usage |
|--------|---------|-------|
| `scripts/check-cj-product.js` | Inspect a single CJ product's raw API data | `node scripts/check-cj-product.js <pid>` |
| `scripts/check-product-stock.js` | Debug per-variant stock — reads `variantInventories` for accurate US/CN breakdown | `node scripts/check-product-stock.js <pid>` |
| `scripts/test-stock-sync.js` | Run stock sync against a single product without burning full catalog API calls | `node scripts/test-stock-sync.js <pid>` |
| `scripts/export-products-excel.js` | Export full catalog to Excel for business reporting / Google Merchant analysis | `node scripts/export-products-excel.js` |
| `scripts/test-email.js` | Verify SendGrid email delivery | `node scripts/test-email.js` |

### Pipeline for New Product Imports

```powershell
# US products:
node scripts/import-us-products.js 31 40        # Import next batch (adjust page range)
node scripts/enrich-us-products.js all           # Enrich: images, descriptions, variants
# CN products:
node scripts/import-cn-products.js 1 5           # Import CN batch

# Both warehouses — run after import + enrich:
node scripts/ai-categorize-remaining.js --apply  # AI categorize (replaces all keyword scripts)
node scripts/ai-clean-names.js --apply           # AI name cleanup
node scripts/fix-prices.js                       # Set pricing using centralized config
node scripts/generate-reviews-v3.js              # Generate fresh reviews
node scripts/fetch-missing-images.js             # Catch any single-image products
node scripts/cleanup-products-v2.js --dry-run    # Review junk (then re-run without --dry-run)

# Update category counts after any bulk changes:
# UPDATE mi_categories c SET product_count = (SELECT COUNT(*) FROM mi_products p WHERE p.category_id = c.id AND p.status = 'active');
```

> **Note:** Keyword-based categorization scripts (`recategorize-all.js`, `categorize-broad.js`, `fix-uncategorized.js`) were retired after Session 19. AI categorization is the standard — cost is ~$0.50 per 3,000 products vs. hours of manual cleanup caused by keyword false positives. Variant color/size extraction is now handled automatically during import via `lib/utils/variant-parser.ts` — no manual script needed.

### Alternative: Add Single Product via Admin
1. **CJ Product:** Go to `/admin/products/add` → "Import from CJ" tab → paste PID → preview → import → Polish
2. **Digital Product:** Go to `/admin/products/add` → "Manual Product" tab → upload file → create

### Excel Product Export
- Script: `scripts/export-products-excel.js`
- Output: `scripts/output/mooreitems-master-product-list.xlsx`
- Columns: ID, Name, Status, Category, CJ PID, CJ Price, Shipping Cost, Stripe Fee, Total Cost, Retail Price, Compare At Price, Margin $, Margin %, Warehouse, Stock Count, Weight (g), Pack Weight (g), CJ Inventory, Review Count, Average Rating, Shipping Estimate, Has Description, Image Count, Created At
- Two sheets: Products (sorted by category then name), Summary (counts per category and status)
- `scripts/output/` is in `.gitignore`

---

## Environment Variables (.env.local — Development)

```
NEXT_PUBLIC_SUPABASE_URL=https://vjiybpiuquttbaimywbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CJ_API_KEY=...  (rotated Feb 23 — old key was briefly exposed in git)
CJ_API_BASE_URL=https://developers.cjdropshipping.com/api2.0/v1
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAIL=mooreitemsshop@gmail.com
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_... (Stripe CLI secret)
ANTHROPIC_API_KEY=sk-ant-api03-...
SENDGRID_API_KEY=SG....
NEXT_PUBLIC_META_PIXEL_ID=2064810427703961
TRACKING_SYNC_SECRET=mooretrack2026
HEALTH_CHECK_SECRET=moorehealth2026
CJ_WEBHOOK_DEBUG=true
```

### Production Environment Variables (Netlify)
```
NEXT_PUBLIC_SUPABASE_URL=https://vjiybpiuquttbaimywbt.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
CJ_API_KEY=...
CJ_API_BASE_URL=https://developers.cjdropshipping.com/api2.0/v1
NEXT_PUBLIC_SITE_URL=https://www.mooreitems.com
ADMIN_EMAIL=mooreitemsshop@gmail.com
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_... (production webhook secret)
ANTHROPIC_API_KEY=sk-ant-api03-...
SENDGRID_API_KEY=SG....
SENDGRID_FROM_EMAIL=mooreitemsshop@gmail.com
SENDGRID_FROM_NAME=MooreItems
NEXT_PUBLIC_META_PIXEL_ID=2064810427703961
TRACKING_SYNC_SECRET=mooretrack2026
HEALTH_CHECK_SECRET=moorehealth2026
AUTO_IMPORT_SECRET=mooreimp2026
```

---

## Key Project Files

### Backend / API Routes
| File | Purpose |
|------|---------|
| `lib/cj/client.ts` | CJ API client with globalThis token caching, rate limiting |
| `lib/cj/fulfill-order.ts` | **Smart fulfillment routing** — CJ, digital, and mixed orders |
| `lib/cj/sync.ts` | Product sync service |
| `lib/cj/reviews.ts` | CJ review sync with CJK filtering |
| `lib/cj/shipping-sync.ts` | Shipping time enrichment |
| `lib/pricing.ts` | Pricing engine (imports from `lib/config/pricing.ts`) |
| `lib/config/pricing.ts` | **Centralized pricing configuration** — hardcoded fallback + `getPricingConfigFromDB()` + `getCategoryPricingRules()` (Session 24) |
| `app/api/admin/pricing-config/route.ts` | **GET/POST global pricing config** — reads/writes `mi_settings` pricing_config (NEW Session 24) |
| `app/api/admin/category-pricing/route.ts` | **GET/POST category pricing rules** — reads/writes `mi_category_pricing` (NEW Session 24) |
| `app/api/auto-import/suggest/route.ts` | **Daily product suggest pipeline** — dual auth, fetches 30 CJ products (pages 31-80), deduplicates, filters furniture/$150 cap, AI scores via Haiku, saves top 10, emails digest (NEW Session 25) |
| `app/api/auto-import/approve/route.ts` | **Single-product approval + full enrichment** — CJ detail, stock, freight, AI categorization, AI name/description rewrite, DB pricing, variants, reviews, category count (NEW Session 25) |
| `app/api/auto-import/reject/route.ts` | **Bulk reject suggestions** (NEW Session 25) |
| `app/api/auto-import/route.ts` | **List suggestions GET** — ?status= filter grouped by batch (NEW Session 25) |
| `lib/config/subcategory-tags.ts` | **Centralized subcategory tag mapping for all 12 categories** |
| `lib/stripe.ts` | Stripe client initialization |
| `lib/shipping.ts` | Shipping cost calculator |
| `lib/email/sendgrid.ts` | SendGrid email client |
| `lib/email/templates/order-confirmation.ts` | Email template with **digital download support** |
| `lib/download-token.ts` | **HMAC-SHA256 token generation for guest downloads** |
| `lib/utils/variant-parser.ts` | **Shared variant color/size extraction** — used by enrichment script + admin CJ import (NEW) |
| `lib/utils/variant-availability.ts` | **Variant availability matrix** — builds valid combo maps, enforces orderable color+size pairs (Session 17) |
| `hooks/useVariantSelection.ts` | **Variant selection state hook** — manages color/size selection, auto-adjustment, add-to-cart protection (Session 17) |
| `lib/types.ts` | Shared TypeScript types (Product, CartItem with isDigital) |
| `lib/supabase/client.ts` | Browser Supabase client (PKCE flow) |
| `lib/supabase/server.ts` | Server Supabase client |
| `lib/supabase/admin.ts` | Service role client (bypasses RLS) |
| `middleware.ts` | Protects /admin/* and /account/* routes |
| `app/api/assistant/route.ts` | AI Shopping Assistant backend (Anthropic API) |
| `app/api/search/route.ts` | Live search endpoint (ilike on product name) |
| `app/api/admin/verify-product/route.ts` | Combined CJ product info + stock check |
| `app/api/admin/orders/fulfill/route.ts` | CJ order fulfillment trigger |
| `app/api/admin/reprice/route.ts` | **One-click catalog repricing** |
| `app/api/admin/products/route.ts` | Product CRUD (GET with ?id= for single, PATCH for update) |
| `app/api/admin/products/add/route.ts` | **Manual product creation** |
| `app/api/admin/products/import-cj/route.ts` | **CJ product import with stock check** |
| `app/api/admin/products/upload-digital/route.ts` | **Digital file upload to Supabase Storage** |
| `app/api/admin/products/generate-reviews/route.ts` | **AI review generation via Claude Haiku** |
| `app/api/admin/products/polish/route.ts` | **AI product polish via Claude Sonnet + Haiku** (NEW) |
| `app/api/checkout/route.ts` | Stripe checkout session creation (**digital-aware**) |
| `app/api/webhooks/stripe/route.ts` | Stripe webhook handler (**smart fulfillment routing, admin order alert**) |
| `app/api/downloads/[orderId]/[itemId]/route.ts` | **Secure download API with signed URLs** |
| `app/api/orders/[sessionId]/route.ts` | Order retrieval with **webhook backup + download tokens** |
| `app/api/orders/lookup/route.ts` | **Guest order lookup by order number + email** |
| `app/api/account/orders/route.ts` | **Order history API (bypasses RLS)** |
| `app/api/account/orders/[id]/route.ts` | **Order detail API (bypasses RLS)** |
| `app/api/reviews/[productId]/route.ts` | Public reviews API — updated Session 31: uses Postgres RPC `get_product_reviews` for correct customer-first sort order |
| `app/api/reviews/submit/route.ts` | **Customer review submission** — purchase verification via mi_orders JOIN mi_order_items, duplicate check, insert with verified_purchase=true, stats recalc on mi_products (NEW Session 31) |
| `app/api/products/route.ts` | Product listing API (slim fields, pagination, sort, filter, **deterministic tiebreaker**) |
| `app/api/subscribe/route.ts` | **Email capture API** — validates email, upserts to mi_email_subscribers (NEW) |
| `app/api/admin/dashboard/route.ts` | **Admin dashboard stats API** — uses admin client to bypass RLS (Session 14) |
| `app/api/admin/customers/route.ts` | **Admin customers API** — uses admin client to bypass RLS (Session 14) |
| `app/api/admin/orders/sync-tracking/route.ts` | **Automated tracking sync** — checks CJ for tracking, updates orders, sends shipping emails (Session 14) |
| `app/api/admin/catalog/health-check/route.ts` | **Catalog health monitor** — 10 automated checks, auto-fixes, email alerts, dual auth for cron (Session 15) |
| `app/api/webhooks/cj/route.ts` | **CJ webhook receiver** — handles STOCK (with data + empty arrays) and VARIANT events, matches cj_vid, updates stock/status, product cascade to out_of_stock (Session 18) |
| `app/api/feeds/google-merchant/route.ts` | **Google Merchant Center product feed** — RSS 2.0 XML with Google taxonomy (Session 14) |
| `lib/seo/constants.ts` | **SEO constants** — base URL, site name, default meta (Session 14) |
| `lib/seo/fetchers.ts` | **SEO data fetchers** — React.cache() wrapped Supabase queries for products/categories (Session 14) |
| `lib/seo/json-ld.tsx` | **JSON-LD components** — Product, BreadcrumbList, Organization, WebSite, CollectionPage, FAQPage schemas (Session 14) |
| `lib/seo/google-categories.ts` | **Google product category mapping** — 12 category slugs → Google taxonomy IDs (Session 14) |
| `app/api/contact/route.ts` | **Contact form handler** — validates fields, sends admin notification (Reply-To customer) + customer auto-reply via SendGrid (NEW Session 26) |
| `lib/email/templates/contact-form.ts` | **Contact form email templates** — admin notification + customer auto-reply, navy/gold styling (NEW Session 26) |
| `app/api/admin/orders/refund/route.ts` | **Admin refund handler** — requireAdmin() guard, validates paid/not-refunded, calls stripe.refunds.create(), updates mi_orders refund columns (NEW Session 27) |
| `supabase/migrations/add_refund_columns.sql` | **Refund schema migration** — adds refund_status, refunded_at, stripe_refund_id to mi_orders (NEW Session 27) |
| `lib/email/templates/health-check.ts` | **Health check alert email template** — health score, auto-fixed counts, flagged issues with product names, CTA to admin (Session 15) |
| `lib/email/templates/new-order-admin.ts` | **Admin new-order notification email template** |

### SEO & Analytics
| File | Purpose |
|------|---------|
| `app/sitemap.xml/route.ts` | **Enhanced sitemap** — image tags, lastmod, changefreq, priority, paginated categories, 6hr cache (Session 14, replaced app/sitemap.ts) |
| `app/robots.ts` | **robots.txt** — allow all, disallow /admin /api /auth /account, allow /api/feeds/google-merchant |
| `app/not-found.tsx` | **Custom 404 page** — search bar, category links, back to home CTA (Session 14) |
| `app/layout.tsx` | Root layout — includes **GA4 + Meta Pixel tracking scripts**, Organization + WebSite JSON-LD (UPDATED) |
| `components/seo/PaginationHead.tsx` | **Pagination SEO** — adds rel prev/next link tags for listing pages (Session 14) |

### Auth Pages
| File | Purpose |
|------|---------|
| `app/login/page.tsx` | Login (email/password + Google) + **guest order lookup link** |
| `app/signup/page.tsx` | Sign up (email/password + Google) |
| `app/forgot-password/page.tsx` | Forgot password (sends reset link) |
| `app/reset-password/page.tsx` | Reset password form |
| `app/auth/callback/route.ts` | OAuth callback handler |
| `components/auth/AuthForm.tsx` | Shared auth page layout |
| `components/auth/GoogleButton.tsx` | Google OAuth button |

### Account Pages
| File | Purpose |
|------|---------|
| `app/account/layout.tsx` | Shared sidebar layout for account section |
| `app/account/page.tsx` | Dashboard (stats, recent orders) — uses `useAuth()` |
| `app/account/orders/page.tsx` | Order history list — **fetches via /api/account/orders** |
| `app/account/orders/[id]/page.tsx` | Order detail with **download buttons** — **fetches via /api/account/orders/[id]** |
| `app/account/wishlist/page.tsx` | Wishlist products grid |
| `app/account/addresses/page.tsx` | Saved addresses CRUD — uses `useAuth()` |
| `app/account/settings/page.tsx` | Profile, email, password settings — uses `useAuth()` |

### Admin Pages
| File | Purpose |
|------|---------|
| `app/admin/page.tsx` | **Dashboard** — real stats, Needs Polish count, Quick Actions (UPDATED) |
| `app/admin/products/page.tsx` | Product management table with **Polish button, pagination, Needs Polish indicator** (UPDATED) |
| `app/admin/products/add/page.tsx` | **Add Product — Manual + CJ Import tabs** |
| `app/admin/products/edit/[id]/page.tsx` | **Edit Product — full form with image reorder, digital file replacement** (UPDATED) |
| `app/admin/pricing/page.tsx` | **Pricing Controls — rebuilt Session 24**: Global Settings (US/CN cards, plain-English labels, persistent save), Category Minimum Prices table (12 categories, editable floors/margins), Live Preview + Reprice |
| `app/admin/analytics/page.tsx` | Analytics — cleaned up, fake data removed (UPDATED) |
| `app/admin/landing-pages/page.tsx` | Landing Pages — Coming Soon (UPDATED) |
| `app/admin/ad-campaigns/page.tsx` | Ad Campaigns — Coming Soon (UPDATED) |
| `app/admin/catalog-health/page.tsx` | **Catalog Health** — health score, 10 checks grouped by severity, expandable product lists, Run Health Check button (Session 15) |
| `app/admin/auto-import/page.tsx` | **Auto Import** — batch grouping, product cards (image, pricing, AI score badge, season/brand/quality pills, reasoning), sequential approve with progress indicator, Run Now button (NEW Session 25) |

### Storefront Pages
| File | Purpose |
|------|---------|
| `app/page.tsx` | Homepage (**randomized hero from best sellers**, 12-category showcase, best sellers, deals, value props) (UPDATED Session 14) |
| `app/product/[slug]/page.tsx` | Product detail — **server wrapper with generateMetadata, JSON-LD** (UPDATED Session 14) |
| `app/product/[slug]/ProductPageClient.tsx` | Product detail client component (**digital-aware**, gallery, variants, reviews, description, recommendations, **image alt text**) (UPDATED Session 14) |
| `app/shop/page.tsx` | All products with 12-category/subcategory filters, infinite scroll, **URL-synced filters**, **noindex for filtered URLs** (UPDATED) |
| `app/category/[slug]/page.tsx` | Category listing — **server wrapper with generateMetadata, SEO description, FAQ accordion, CollectionPage + FAQPage JSON-LD** (UPDATED Session 14) |
| `app/category/[slug]/CategoryPageClient.tsx` | Category listing client component with subcategory tags, infinite scroll, **heading hierarchy fixes** (Session 14) |
| `app/trending/page.tsx` | Trending products (by review_count), infinite scroll |
| `app/deals/page.tsx` | Deals (by discount percentage), infinite scroll |
| `app/new-arrivals/page.tsx` | New arrivals (by created_at), infinite scroll |
| `app/search/page.tsx` | Search results, infinite scroll |
| `app/cart/page.tsx` | Cart with discount codes + **digital/physical-aware shipping messaging** + **fixed trust badges** (UPDATED) |
| `app/order/confirmation/page.tsx` | Order confirmation **with download buttons for digital items** |
| `app/order/lookup/page.tsx` | **Guest order lookup** |
| `app/about/page.tsx` | About Us |
| `app/shipping-policy/page.tsx` | Shipping Policy |
| `app/returns/page.tsx` | Returns & Refunds |
| `app/faq/page.tsx` | FAQ with accordion |
| `app/contact/page.tsx` | Contact Us form |
| `app/privacy-policy/page.tsx` | Privacy Policy |
| `app/terms/page.tsx` | Terms of Service |

### Key Components
| File | Purpose |
|------|---------|
| `components/storefront/ShoppingAssistant.tsx` | AI chat assistant (client component) |
| `components/storefront/ShoppingAssistantWrapper.tsx` | SSR-safe wrapper (dynamic import) |
| `components/storefront/MegaMenu.tsx` | Full-width mega menu (uses `useCategories()`) |
| `components/storefront/CategoryShowcase.tsx` | **Homepage 12-category grid (uses `useCategories()`)** |
| `components/storefront/ImageGallery.tsx` | Product image gallery with lightbox + variant image switching + **descriptive alt text** (UPDATED Session 14) |
| `components/storefront/ProductCard.tsx` | Product card (lazy loading, **passes isDigital to cart**, **image alt text**) (UPDATED Session 14) |
| `components/storefront/QuickViewModal.tsx` | Quick view modal (**passes isDigital to cart**) |
| `components/storefront/TrustBadges.tsx` | Trust badges (**compact horizontal layout**) (UPDATED) |
| `components/sections/FlashDeals.tsx` | Flash deals section (**passes isDigital to cart**) |
| `components/product/VariantSelector.tsx` | Color/size selector with gold highlight, **availability matrix integration — greys out invalid combos** (REWRITTEN Session 17) |
| `components/product/ProductGrid.tsx` | Responsive product grid (4-col desktop, 2-col mobile) |
| `components/providers/AuthProvider.tsx` | **Shared auth context (single getUser + mi_customers)** |
| `components/providers/CategoriesProvider.tsx` | **Shared categories context (single fetch)** |
| `components/providers/CartProvider.tsx` | Cart context (**CartItem includes isDigital**) |
| `components/providers/WishlistProvider.tsx` | Wishlist context (Set-based lookups, DB sync for logged-in) |
| `components/layout/Header.tsx` | Header (uses `useCategories()` + `useAuth()`) |
| `components/layout/Footer.tsx` | Navy footer — **official brand social icons** (react-icons), category links, policy links, payment icons, Ai-genda branding (UPDATED Session 14) |
| `components/admin/Sidebar.tsx` | Admin sidebar (**grouped sections, Coming Soon badges**) (UPDATED) |
| `components/admin/StatCard.tsx` | Stat card (**custom icon colors for Needs Polish**) (UPDATED) |
| `components/admin/PolishModal.tsx` | **AI product polish modal** (NEW) |
| `components/MetaPixel.tsx` | **Meta Pixel tracking** — PageView, ViewContent, AddToCart, Purchase events. fbq stub always loads; fbevents.js gated behind cookie consent (UPDATED Session 27) |
| `components/CookieConsent.tsx` | **Cookie consent banner** — navy fixed bottom bar, Decline/Accept All, sets mi_cookie_consent in localStorage, dispatches mi:cookie-consent-accepted event (NEW Session 27) |
| `components/storefront/EmailPopup.tsx` | **Email capture popup** — 10s delay, WELCOME10 code, copy button, localStorage persistence (NEW) |
| `components/storefront/RecentlyViewed.tsx` | **Recently viewed** — stores only product IDs in localStorage, fetches fresh data from API (UPDATED Session 14) |
| `types/global.d.ts` | **Global TypeScript declarations** — window.fbq for Meta Pixel (NEW) |

---

## DNS Records (Namecheap)

| Type | Host | Value |
|------|------|-------|
| A | `@` | `75.2.60.5` (Netlify) |
| CNAME | `www` | `mooreitems.netlify.app` |
| CNAME | `auth` | `vjiybpiuquttbaimywbt.supabase.co` |
| TXT | `_acme-challenge.auth` | *(Supabase SSL verification — may rotate)* |
| TXT | `@` | `google-site-verification=zWsT9hFaG7oxaubyTIawBiMRvEhkW2d2f4rnv` (Google Search Console) |
| *(SendGrid domain auth)* | *(6 records for www.mooreitems.com)* | *(CNAME records for SendGrid)* |

---

## Build Phases

### Phase 1-4: ✅ COMPLETE (Foundation, UI, Backend, Frontend)

### Phase 5: ✅ COMPLETE — Stripe & Checkout

### Phase 5.5: ✅ COMPLETE — US Catalog Build (Feb 18)
- 3,092 active US warehouse products imported and enriched
- All categorized, names cleaned, reviews generated, prices set

### Phase 6: ✅ COMPLETE — Order Pipeline (Feb 19)
- Stripe webhook → CJ order creation with USPS+ logistics
- Tracking sync script
- Combined admin verify endpoint
- CJ auth token caching (globalThis)
- ⚠️ Pending: CJ balance funding to process real orders

### Phase 7: ✅ COMPLETE — Polish & Launch (Feb 19-20)
- [x] Homepage redesign (hero, categories, best sellers, deals, value props)
- [x] Visual mega menu with product previews
- [x] Live search with suggestions
- [x] "You May Also Like" recommendations
- [x] AI Shopping Assistant (Claude-powered)
- [x] 7 policy/info pages
- [x] Footer redesign with Ai-genda branding
- [x] Favicon
- [x] Mobile optimization pass
- [x] Product cleanup (159 junk hidden, 496 additional names cleaned)
- [x] Infinite scroll pagination (optimized payloads)
- [x] DescriptionFormatter (strips CJ marketing, accordion specs)
- [x] Color variant image switching
- [x] SendGrid email integration (order confirmation + auth SMTP)

### Phase 8: ✅ COMPLETE — Customer Accounts & Shipping (Feb 20-21)
- [x] Scrolling ticker banner (3 shipping messages, animated marquee)
- [x] All shipping times updated 3-7 → 2-5 business days
- [x] Shipping callouts (product pages, product cards, cart, homepage)
- [x] Customer auth (email/password + Google OAuth)
- [x] Supabase custom auth domain (auth.mooreitems.com)
- [x] Google OAuth with MooreItems branding
- [x] MooreItems email templates via SendGrid SMTP
- [x] Database trigger for auto customer profile creation
- [x] My Account dashboard with order stats + wishlist count
- [x] Order History page
- [x] Order Detail page with status timeline + tracking
- [x] Persistent wishlist (synced to DB, localStorage fallback for guests)
- [x] Saved Addresses (CRUD with default selection)
- [x] Account Settings (profile info, email change, password change)

### Phase 8.5: ✅ COMPLETE — Category Restructure & Performance (Feb 21)
- [x] 12 categories (from 8) — Home & Garden split into Home & Furniture, Garden & Outdoor + 4 new
- [x] Recategorization script with priority keyword matching (~1,800 products reassigned)
- [x] Product counts removed from all UI
- [x] Subcategory tags centralized
- [x] 12 category images generated and compressed (80MB → 1.7MB)
- [x] Shared AuthProvider + CategoriesProvider (eliminated duplicate API calls)
- [x] WishlistProvider Set-based lookups
- [x] Slim API queries, batch size 24, skeleton loading, preload
- [x] Infinite scroll fixed across all listing pages
- [x] Admin Pricing Controls with centralized config

### Phase 9: ✅ COMPLETE — Digital Products & Developer Tooling (Feb 23)
- [x] **Claude Code installed** — terminal-based AI development tool
- [x] **Git initialized** — GitHub repo at `tibbyy05/Moore-Items`
- [x] **Add Product page** — Manual product tab + CJ Import tab
- [x] **CJ Import** — preview, pricing, US warehouse detection fix, duplicate check
- [x] **Edit Product page** — full edit form with digital file replacement
- [x] **AI Review Generation** — Claude Haiku, admin button, auto-updates counts
- [x] **Smart fulfillment routing** — CJ, digital, mixed order handling
- [x] **Digital product delivery** — upload, checkout ($0 shipping), instant delivery, secure downloads
- [x] **HMAC token downloads** — guest access without account creation
- [x] **Guest order lookup** — `/order/lookup` with order number + email
- [x] **Order history RLS fix** — server API routes bypass RLS with admin client
- [x] **Email-based order matching** — case-insensitive, cart sends user email
- [x] **Cart digital awareness** — appropriate shipping/delivery messaging
- [x] **Storefront digital awareness** — violet badges, instant download messaging
- [x] **Security fix** — CJ API token scrubbed from git history, key rotated
- [x] **Stripe CLI** — local webhook forwarding configured

### Phase 10: ✅ COMPLETE — Admin Polish, Deployment & SEO (Feb 24-25)
- [x] **Admin dashboard cleanup** — sidebar grouped, fake data removed, Needs Polish stat, Quick Actions
- [x] **Products page** — pagination fixed, dead buttons removed
- [x] **Analytics page** — fake data removed, empty columns removed
- [x] **Landing Pages & Ad Campaigns** — Coming Soon badges
- [x] **AI Product Polish** — API + Modal + admin integration (Sonnet for cleanup, Haiku for reviews)
- [x] **Edit Product image reorder** — thumbnail grid with position controls
- [x] **17 TypeScript errors fixed** — lib/stripe.ts, checkout, webhook, providers, components
- [x] **Site deployed to Netlify** — live at mooreitems.com
- [x] **DNS configured** — A record, CNAME www, Google verification TXT
- [x] **Stripe live mode** — production webhook at mooreitems.com/api/webhooks/stripe
- [x] **First live transaction** — $13.98, webhook delivered, email sent, refunded
- [x] **Supabase updated** — Site URL, auth redirects, Google OAuth origins
- [x] **Google Search Console** — verified, sitemap submitted, 3,073 pages, homepage indexed
- [x] **Dynamic sitemap** — app/sitemap.ts queries products/categories/static pages
- [x] **robots.txt** — app/robots.ts with proper disallows
- [x] **Google Analytics GA4** — G-23H54T894J, enhanced measurement, realtime confirmed
- [x] **metadataBase** — set to https://www.mooreitems.com
- [x] **Deterministic sorting** — tiebreaker by id for pagination
- [x] **Shop filter URL persistence** — synced to URL params, back button preserves
- [x] **Product API fix** — added missing warehouse field
- [x] **CJ variant stock** — uses is_active for CJ products instead of stock_count
- [x] **Cart trust badges** — compact horizontal layout, no overlap
- [x] **Edit product image save fix** — hasFetched guard prevents overwrite
- [x] **Weight data enrichment** — fetch-weights.js script, ~1,120 products enriched
- [x] **Excel export** — export-products-excel.js with full product data
- [x] **Test orders cleaned up** — 9 orders + 10 items deleted
- [x] **Stripe checkout shipping** — updated to "2-5 business days"

### Phase 11: ✅ COMPLETE — Data Quality, Ad Infrastructure & Catalog Polish (Feb 26)
- [x] **Fix import pipeline** — shared `lib/utils/variant-parser.ts` used by enrichment script + admin CJ import
- [x] **Verify admin CJ import** — CJ tab now maps color/size correctly via shared parser
- [x] **Sort variant selectors** — smart sorting: numeric ascending, clothing XS→4XL, shoe sizes, alphabetical fallback
- [x] **CJ payment resolved** — pay-per-order with PayPal/credit card (no wallet pre-funding needed)
- [x] **Weight enrichment nearly complete** — ~2,900 products done, ~127 remaining (likely discontinued)
- [x] **Install Meta Pixel** — ID 2064810427703961, PageView/ViewContent/AddToCart/Purchase events
- [x] **Meta Business Portfolio** — "MooreItems" created in Meta Business Suite
- [x] **Bulk product polish** — 1,643 products AI-polished via Claude Haiku (names + descriptions rewritten)
- [x] **All products have reviews** — zero products with review_count = 0

### Phase 12: ✅ COMPLETE — Order Validation, Conversion Optimization & Revenue (Feb 26-27)
- [x] **Order pipeline validated end-to-end** — real orders placed, CJ fulfillment debugged, first revenue earned
- [x] **CJ fulfillment debugging** — error 1603000 (debug logging added), error 1604000 (pay-per-order in dashboard)
- [x] **Phone number collection** — added to Stripe checkout, passed to CJ fulfillment
- [x] **Email capture popup** — WELCOME10 (10% off), 10s delay, localStorage persistence, excluded from admin/auth pages
- [x] **Abandoned cart recovery** — Stripe `checkout.session.expired` webhook → SendGrid email with SAVE10 discount
- [x] **Urgency signals** — "X people viewing" counter, low stock badges, "X sold in last 24 hours" on product pages + cards
- [x] **mi_email_subscribers table** — email capture storage with source tracking
- [x] **n8n automation architecture planned** — trending product scout concept ready for implementation

### Phase 13: ✅ COMPLETE — SEO, Google Shopping, Admin Fixes & Automation (Feb 27-28)
- [x] **Full SEO implementation (Phases 1-3, 5)** — JSON-LD structured data, per-page meta tags, OG images, image alt text, heading hierarchy, noindex filters, category pillar pages with FAQ, enhanced sitemap, custom 404, pagination SEO
- [x] **Google Merchant Center** — 3,030 products approved for free Google Shopping listings, daily feed fetch
- [x] **Google Merchant product feed** — `/api/feeds/google-merchant` with taxonomy mapping, XML escaping fix
- [x] **Social media profiles created** — Instagram, Facebook, TikTok, LinkedIn pages
- [x] **Official brand icons in footer** — react-icons replacing Lucide icons
- [x] **Homepage hero randomization** — Fisher-Yates shuffle of top 24 best sellers, different on each load
- [x] **Recently viewed fix** — stores only product IDs, fetches fresh data from API (no stale images)
- [x] **Admin dashboard RLS fix** — orders/customers now visible via admin service role client
- [x] **Admin dashboard time filter** — Today, This Week, Last Week, This Month, Last Month, This Quarter, All Time
- [x] **Admin customers page RLS fix** — same admin client pattern
- [x] **Manual order controls** — update fulfillment status, tracking number, clear notes from admin
- [x] **Automated tracking sync** — `/api/admin/orders/sync-tracking` checks CJ, updates orders, sends shipping emails
- [x] **Cron job** — cron-job.org every 4 hours with secret key auth
- [x] **Shipping notification emails** — auto-sent when tracking found, branded template with USPS tracking link

### Phase 14: ✅ COMPLETE — Catalog Health, Inventory Protection & Data Quality (Feb 28)
- [x] **CJ checkout validation** — verifies product availability via CJ inventory API before creating Stripe session
- [x] **10 delisted CJ products removed** — set to `out_of_stock` status
- [x] **2 junk products hidden** — poorly translated name + adult product
- [x] **2,667 zero-stock variants fixed** — bulk updated to stock_count = 100
- [x] **Import pipeline hardened** — all 3 variant insert paths (import-cj, sync.ts, enrich script) now force stock_count = 100
- [x] **1,252 orphaned products fixed** — 8,001 variants created from existing CJ raw data that were never parsed into mi_product_variants
- [x] **20 missing descriptions generated** — Claude Haiku marketing copy via fix-missing-descriptions.js
- [x] **Weight data confirmed complete** — all 3,018/3,018 CJ products have productWeight in cj_raw_data
- [x] **Catalog health monitor** — 10 automated checks with auto-fix for safe issues
- [x] **Admin catalog health page** — `/admin/catalog-health` with health score visualization, expandable check cards, edit links
- [x] **Daily health check cron** — cron-job.org at 3 AM EST with HEALTH_CHECK_SECRET auth
- [x] **Health check email alerts** — SendGrid notification when issues found, skips email if 100% healthy
- [x] **Supabase pagination fix** — fetchAll() helper for queries exceeding 1,000 row limit
- [x] **Weight parsing fix** — parseFloat() for CJ range-format weights like "1.00-912.00"
- [x] **Promo code management** — admin page with influencer tracking
- [x] **Health score: 55% → 100%** — all HIGH and MEDIUM checks clear, only LOW (cosmetic) remaining = 0
- [x] **Unified import pipeline spec written** — comprehensive technical spec for future single-command product imports

### Phase 15: ✅ COMPLETE — Admin Cleanup, Catalog Curation & Google Merchant Setup (Feb 28)
- [x] **Stale pending order auto-cleanup** — tracking sync cron deletes pending orders > 48 hours old
- [x] **Admin orders page improved** — defaults to "Paid" tab, Delivered tab added, tab order: Paid/Processing/Shipped/Delivered/All/Pending/Unfulfilled
- [x] **9 test pending orders cleaned** — manual SQL cleanup of mooreitemsshop@gmail.com test checkouts
- [x] **Shipping language updated** — "Ships in 2-5 days" → "Delivered in 2-5 days" sitewide
- [x] **Homepage social proof section** — 4 trust stats with gold icons between Best Sellers and value props
- [x] **Compare-at price tightened** — multiplier reduced 1.8-2.2x → 1.3-1.6x for more believable "was" pricing
- [x] **Review counts randomized** — all products had 34 reviews, now randomized by price tier (8-35, 4-20, 1-12)
- [x] **14 supplement products hidden** — liability risk (vitamins, capsules, gummies, tablets)
- [x] **13 duplicate chenille sofas hidden** — kept 3 unique styles
- [x] **5 small-image products hidden** — Google Merchant Center image too small disapprovals
- [x] **6 product names cleaned** — stripped "New Product", "Top Sale", "New Style" promotional prefixes
- [x] **2 misc products hidden** — poorly named products
- [x] **Digital product urgency fix** — removed fake "Only X left" badges from unlimited digital downloads
- [x] **Google Merchant Center fully configured** — shipping ($4.99 flat, free over $50, 2-5 biz days, Eastern TZ 2PM cutoff), returns (30-day, by mail, customer pays return shipping, 7-day refund processing)
- [x] **Kids Printable Activity Bundle verified** — digital product confirmed active with pricing and images

### Phase 16: ✅ COMPLETE — Variant Data Quality & Selection System (Mar 1)
- [x] **3-phase variant data repair** — 444 broken products fixed, 3,773→0 broken variants
- [x] **Phase 1:** Backfill script for variants with null color/size but parseable names
- [x] **Phase 2:** SQL pattern batches for common patterns (slash-separated, color-only, size-only)
- [x] **Phase 3:** Automated prefix stripping + final manual fixes for remaining edge cases
- [x] **Variant availability matrix** — `lib/utils/variant-availability.ts` maps valid color+size combos per product
- [x] **Updated VariantSelector** — greys out invalid combos (strikethrough + opacity), auto-adjusts selection
- [x] **useVariantSelection hook** — manages all variant state for ProductPageClient
- [x] **Integrated into ProductPageClient + QuickViewModal** — both use new availability system
- [x] **Add-to-cart protection** — disabled unless valid variant selected
- [x] **Image fallback chain** — exact combo → same color → first available
- [x] **95.1% variant data quality** — 28,104 variants, up from ~50% pre-enrichment
- [x] **Zero TypeScript errors** — build passes clean
- [x] **Live site verified** — Computer Desk product confirmed greyed-out combos working correctly

### Phase 17: ✅ COMPLETE — CJ Real-Time Stock Sync via Webhooks (Mar 1)
- [x] **CJ webhook system** — registered STOCK, PRODUCT, LOGISTICS webhooks with CJ API
- [x] **Webhook receiver** — `app/api/webhooks/cj/route.ts` handles STOCK (with data + empty arrays) and VARIANT events
- [x] **Serverless fix** — moved all DB processing before response (Netlify terminates after response)
- [x] **Payload format discovery** — CJ's actual formats differ from docs, handler accommodates all shapes
- [x] **Empty stock array handling** — zeros out variants when CJ clears stock, cascades to product out_of_stock
- [x] **Logging noise reduction** — only logs on actual matches, debug mode via CJ_WEBHOOK_DEBUG env var
- [x] **End-to-end confirmed** — real variant matched in 266ms
- [x] **Three-layer inventory protection complete** — webhooks (real-time) + checkout validation (safety net) + health monitor (daily)

### Phase 18: ✅ COMPLETE — Comprehensive AI Catalog Cleanup (Mar 1)
- [x] **AI category audit** — Claude Haiku audited all ~2,900 products for category accuracy ($0.56)
- [x] **154 junk/duplicate products hidden** — auto parts, adult products, industrial items, true duplicates
- [x] **100 high-confidence category moves** — furniture in Electronics/Jewelry/Pet, kitchen items, beauty items
- [x] **Comprehensive quality audit** — categories, duplicates, junk names, missing data ($0.42)
- [x] **117 grouped category moves** — pattern-based batch moves across 12 category groups
- [x] **172 legitimate products rescued from hidden** — office desks, jewelry, furniture wrongly hidden, names cleaned via AI ($0.18)
- [x] **Skeleton grid bug fixed** — 4-col skeleton vs 3-col product grid mismatch in CategoryPageClient
- [x] **Infinite scroll error handling** — hasMore reset on fetch errors prevents infinite retry loops
- [x] **4 audit scripts built** — ai-category-audit.js, filter-moves.js, full-product-audit.js, category-audit.js
- [x] **Total AI cost: ~$1.60** — Claude Haiku for all audits + name cleanup
- [x] **Category counts refreshed** — accurate numbers across all 13 categories

### Phase 19: ✅ COMPLETE — China Warehouse Expansion (Mar 3)
- [x] **Full code + database audit** — examined all 17 key files + 6 SQL queries before changes
- [x] **Database cleanup** — 159 stale "3-7 business days" shipping estimates fixed, `warehouse` column added to `mi_order_items`
- [x] **CN pricing config** — `CN_PRICING_CONFIG` (2.2x markup, 45% min margin, $5 shipping), `getPricingConfig()` helper
- [x] **Warehouse-aware CJ fulfillment** — per-product `wareHouseCountryCode`, USPS+ for US, CJPacket for CN, mixed order support
- [x] **Dual-warehouse webhook stock sync** — tracks US + CN stock per country code, matches to product's actual warehouse
- [x] **Product card CN badge** — amber Globe icon, "Delivered in 7-15 days"
- [x] **Cart warehouse messaging** — US-only, CN-only, mixed, digital+physical all handled
- [x] **Checkout stores warehouse per order item** — `mi_order_items.warehouse` column
- [x] **Google Merchant feed CN shipping** — "International Standard", 7-15 day transit, $6.99
- [x] **CN import script** — `scripts/import-cn-products.js` with CN-specific pricing/shipping/margins
- [x] **Sitewide messaging update** — ticker, about, shipping policy, AI assistant, 12 category descriptions
- [x] **First CN batch imported** — 90 products, 71 active after AI categorization + 16 junk filtered
- [x] **CN products fully enriched** — images, AI-polished names + descriptions, reviews
- [x] **"Ships from China" spacing fix** — missing space between "from" and "China" on product page
- [x] **Ticker redesigned** — 4 new messages: secure checkout, fast delivery, free shipping, reviews

### Phase 20: 🔄 NEXT — Meta Ads, Growth & Expansion
- [ ] **Meta Ads setup & launch** — first ad campaigns (Pixel + Business Portfolio + social profiles ready)
- [ ] **Import more CN products** — expand CN catalog with trending/ad-worthy products
- [ ] **Split shipping for mixed carts** — separate shipping lines for US vs CN items in Stripe checkout
- [ ] **Shop page "Fast Shipping" filter** — filter pill for US warehouse products only
- [ ] **Health monitor CN checks** — CN products missing weight (critical for shipping cost)
- [ ] **AI Shopping Assistant warehouse awareness** — prioritize US products when fast shipping requested
- [ ] Blog/content section (Phase 4 SEO — buying guides, seasonal content)
- [ ] Landing page builder (admin feature)
- [ ] Ad campaign manager (admin feature)
- [ ] More digital products (expand PLR/MRR catalog)
- [ ] Custom landing pages for winning products
- [ ] Unified import pipeline (spec ready — replaces 9-script manual sequence, use AI categorization instead of keywords)
- [ ] **AliExpress/Alibaba supplier abstraction** — add `supplier` column and adapter interface when ready

---

## Key Decisions Made

1. **Custom build over Shopify** — saves $1,200+/year
2. **CJ Dropshipping over TopDawg** — $0/month vs $140+/month
3. **US + CN warehouse products** — US for fast 2-5 day shipping, CN for trending products and expanded catalog (Session 20: CN expansion launched)
4. **General store over single-niche** — let ads determine winners
5. **Standalone scripts over admin API routes** — more reliable, better error logging
6. **AI-generated reviews (V3)** — all 4-5 stars, recent dates, realistic names
7. **Activate all, then curate** — faster than manually approving each product
8. **Import by popularity** — CJ listV2 sorted by most listed ensures best-sellers first
9. **AI Shopping Assistant** — major differentiator, no other dropship store has this
10. **globalThis token caching** — solves Next.js hot reload losing CJ auth tokens
11. **USPS+ logistics** — reliable 2-5 day US shipping at ~$6/order
12. **Powered by Ai-genda.com** — cross-promotes Danny's other business
13. **Shared Supabase project** — keeps Ai-genda + MooreItems in one project, `mi_` prefix for separation, saves $10/mo
14. **@supabase/ssr over auth-helpers** — compatible with Next.js 13.5.1 App Router
15. **Database trigger for signups** — auto-creates mi_customers via SECURITY DEFINER function, works for both email + Google
16. **SendGrid for all email** — transactional (order confirmation) + auth (SMTP for Supabase signup/reset)
17. **12 categories over 8** — broke up bloated Home & Garden (1,417) into focused categories for better navigation
18. **Remove product counts from UI** — customers should click categories regardless of count
19. **Centralized pricing config** — single file to change all pricing variables, reprice via admin UI or script
20. **Shared React providers** — AuthProvider + CategoriesProvider eliminate duplicate API calls across components
21. **Claude Code for development** — direct file access beats pasting code snippets, can run builds and verify
22. **digital_file_path over separate boolean** — single column as source of truth for digital detection
23. **HMAC tokens for guest downloads** — secure, no account required, included in emails
24. **Server API routes for order history** — bypass RLS issues with admin client
25. **Smart fulfillment routing** — separate CJ, digital, and mixed orders at webhook level
26. **Webhook backup on confirmation page** — handles localhost testing without Stripe CLI
27. **Avoid furniture dropshipping** — freight costs kill margins on heavy/oversized items
28. **AI product polish over manual cleanup** — Sonnet rewrites names/descriptions/categories better than regex scripts (NEW)
29. **Stripe webhook URL without www** — mooreitems.com (not www) avoids 308 redirect (NEW)
30. **CJ variant inStock uses is_active** — stock_count unreliable for CJ products (NEW)
31. **force-dynamic on all storefront pages** — prevents Next.js/Netlify build-time caching from showing stale prices (Session 11)
32. **AI scripts for data cleanup over manual** — Claude Haiku categorizes/renames products faster and more accurately than regex (Session 11)
33. **Extract variant data from names post-import** — CJ enrichment doesn't parse color/size, so `extract-variant-data.js` fills the gap (Session 11)
34. **hasInitialized ref to block variant auto-select** — prevents variant useEffect from hijacking gallery image on page load (Session 11)
35. **Shared variant parser over duplicated logic** — `lib/utils/variant-parser.ts` ensures enrichment script and admin import use identical color/size extraction (Session 12)
36. **Smart size sorting at display time** — sort by numeric/clothing/shoe patterns in VariantSelector, don't change database (Session 12)
37. **Meta Pixel via Next.js Script component** — `afterInteractive` strategy, env-var gated, with ViewContent/AddToCart/Purchase conversion events (Session 12)
38. **CJ pay-per-order over wallet pre-funding** — eliminates Payoneer setup friction, PayPal/credit card accepted at CJ order checkout (Session 12)
39. **Bulk polish via Claude Haiku over Sonnet** — 10x cheaper for batch operations, quality sufficient for product descriptions (Session 12)
40. **Phone number at checkout over optional** — CJ needs real phone for shipping labels, Stripe `phone_number_collection` is seamless (Session 13)
41. **Email popup 10s delay over immediate** — lets customer browse before interrupting, localStorage prevents annoyance (Session 13)
42. **Abandoned cart via Stripe expired sessions** — no custom timer needed, Stripe fires `checkout.session.expired` after 24hr automatically (Session 13)
43. **Simulated urgency over no urgency** — "X viewing", low stock, "X sold" are free conversion boosters, deterministic hash ensures consistency across page loads (Session 13)
44. **CJ manual payment in dashboard over wallet pre-funding** — confirmed by CJ agent Ruth, API creates order → pay with credit card in dashboard → CJ ships (Session 13)
45. **n8n for product intelligence automation** — scheduled trending product discovery using Google Trends + Reddit + AI, matches against existing catalog (planned Session 13)
46. **React.cache() for SEO fetchers** — deduplicates Supabase queries between generateMetadata and page component, zero extra DB calls (Session 14)
47. **Server component wrappers over layout.tsx metadata** — each page gets its own server wrapper with generateMetadata for unique SEO per route (Session 14)
48. **Category SEO descriptions in database** — added `description` and `faq_json` columns to mi_categories rather than hardcoding in components (Session 14)
49. **Custom sitemap route handler over Next.js sitemap.ts** — allows image tags, cache headers, and paginated category URLs that sitemap.ts can't do (Session 14)
50. **Google Merchant Center free listings over paid Shopping ads** — zero cost, 3,030 products in Google Shopping immediately, paid ads can layer on later (Session 14)
51. **Cron-job.org over self-hosted cron** — free, reliable, no server needed for tracking sync every 4 hours (Session 14)
52. **Admin service role client for dashboard** — bypass RLS to show all orders/customers, verify admin auth first then query with admin client (Session 14)
53. **Recently viewed stores IDs only** — fetch fresh product data on render instead of caching full objects in localStorage that go stale (Session 14)
54. **Official react-icons over Lucide for social** — FaInstagram, FaFacebookF, FaTiktok, FaLinkedin look exactly like the real platform icons (Session 14)
55. **Three-layer inventory protection** — health monitor catches issues daily, auto-fixes handle safe issues, checkout validation is last line of defense blocking delisted products (Session 15)
56. **Supabase fetchAll() helper for health checks** — paginates in batches of 1,000 to bypass Supabase default row limit that caused false positives (Session 15)
57. **parseFloat() over Number() for CJ weight data** — CJ stores weight as range strings like "1.00-912.00", parseFloat correctly extracts first number while Number returns NaN (Session 15)
58. **Fire-and-forget email alerts** — health check emails don't block the API response, errors logged but don't fail the check (Session 15)
59. **Variant stock_count hardcoded to 100 on all import paths** — prevents orphaned zero-stock variants that silently block checkout (Session 15)
60. **Health check email only on issues** — skips sending when 100% healthy to avoid daily noise (Session 15)
61. **Stale pending order cleanup via existing cron** — piggybacks on tracking sync (every 4 hours) to delete pending orders > 48 hours, no new cron job needed (Session 16)
62. **Admin orders default to "Paid" tab** — pending orders from abandoned checkouts are noise, paid orders are what matters (Session 16)
63. **"Delivered in" over "Ships in"** — customers care about when they receive it, not when it leaves the warehouse (Session 16)
64. **Compare-at price 1.3-1.6x over 1.8-2.2x** — smaller markup difference looks more believable, less "too good to be true" (Session 16)
65. **Hide supplements over selling them** — liability risk not worth the margin, no quality control on dropshipped ingestibles (Session 16)
66. **Hide duplicate products over merging** — 13 identical chenille sofas with same images aren't worth keeping, 3 unique styles sufficient (Session 16)
67. **Homepage social proof between Best Sellers and value props** — trust signals after product discovery, before conversion nudge (Session 16)
68. **Availability matrix over simple validation** — pre-computing all valid combos enables greyed-out UI (Amazon-style) instead of just error messages after selection (Session 17)
69. **Custom hook over inline state** — useVariantSelection encapsulates all variant logic, keeps ProductPageClient clean, reusable in QuickViewModal (Session 17)
70. **3-phase variant repair over re-import** — fixing existing data (SQL + scripts) is faster and safer than re-importing from CJ and risking data loss (Session 17)
71. **Auto-adjust selection over clearing** — when user picks a color, keep current size if valid or pick first available, rather than forcing re-selection of both (Session 17)
72. **CJ webhooks over polling for stock sync** — CJ's 1,000/day API limit makes polling impractical for ~28,000 variants; webhooks provide real-time updates at zero API cost (Session 18)
73. **Process before response in serverless** — Netlify terminates functions after sending response, so all DB work must complete before returning 200; Supabase queries (<100ms) easily fit within CJ's 3-second timeout (Session 18)
74. **Silent drop for non-matching events** — CJ sends webhooks for entire catalog (thousands of products), most won't match store's ~3,000 products; logging every miss would create massive noise (Session 18)
75. **CJ_WEBHOOK_DEBUG env var over always-log** — raw body logging only when debugging, keeps production logs clean while maintaining troubleshooting capability (Session 18)
76. **Three-layer inventory protection** — webhooks (real-time primary) + checkout validation (safety net blocks payment) + health monitor (daily audit catches drift); defense in depth for the most critical e-commerce function (Session 18)
77. **AI categorization over keyword regex for imports** — keyword matching caused widespread miscategorization ("crystal" → Jewelry caught car wax, "USB" → Electronics caught bed frames); Haiku costs ~$0.50 per 3,000 products and is dramatically more accurate (Session 19)
78. **Rescue hidden products over leaving them** — audit of 369 hidden products found 172 were legitimate products wrongly hidden; better to clean names and reactivate than lose sellable inventory (Session 19)
79. **Multi-pass audit approach** — AI audit → filter high-confidence moves → apply → re-audit for remaining patterns; safer than applying all 700+ AI recommendations at once (Session 19)
80. **Supplements stay hidden regardless of audit** — liability decision (Session 16) overrides AI recommendation to reactivate; no quality control on dropshipped ingestibles (Session 19)
81. **Audit before building** — full code + database audit before CN expansion revealed system was already 80% CN-ready, reduced estimated work from 7-9 sessions to 1 session (Session 20)
82. **Separate pricing config per warehouse over single config** — CN needs higher markup (2.2x vs 2.0x) and higher shipping estimate ($5 vs $3) to cover longer shipping risk and international logistics costs (Session 20)
83. **CJPacket Ordinary over ePacket for CN logistics** — CJ's own logistics has better integration, decent speed (7-15 days), and reliable tracking for US-bound shipments (Session 20). Updated from 'CJPacket' to 'CJPacket Ordinary' — the correct method name (Session 44). CJ default shipping rule configured in dashboard (Cost Priority, CJPacket Ordinary)
84. **Per-product wareHouseCountryCode over per-order** — allows mixed US+CN orders where each product specifies its own warehouse; CJ handles shipment splitting automatically (Session 20)
85. **Dual-country stock tracking in webhooks** — collect all stock data (US + CN), then match to product's warehouse; future-proofs for multi-warehouse products (Session 20)
86. **CN pricing: 2.2x markup, 45% min margin** — higher than US (2.0x, 40%) to compensate for longer delivery, higher return risk, and more expensive international shipping (Session 20)
87. **Persistent pricing config in DB over hardcoded TypeScript** — config in mi_settings survives page refresh, cold starts, and deploys; hardcoded constants remain as fallback only (Session 24)
88. **Category pricing via separate table over columns on mi_categories** — `mi_category_pricing` is easier to manage, doesn't bloat the categories table, and can be upserted independently (Session 24)
89. **Lower launch pricing (1.6x) over profit-maximizing (2.0x)** — more competitive prices drive initial traffic and reviews; raise multiplier later once traffic proves demand (Session 24)
90. **UUID-to-slug map over string normalization in reprice route** — products store category as UUID, not name string; building a categoryIdToSlug map at loop start is robust and zero-miss vs regex slug derivation (Session 24)
91. **Floor enforcement after calculatePricingWithConfig() over before** — calculate natural price first, then lift to floor if needed; this preserves the correct margin recalculation at the floored price (Session 24)
92. **fbq stub always loads, fbevents.js gated behind consent** — the stub is pure JS object setup (no network call); splitting stub from SDK load is the technically correct consent-gated pixel approach; ensures queued events (ViewContent, AddToCart, Purchase) flush automatically on consent without page reload (Session 27)
93. **Cookie consent localStorage key mi_cookie_consent** — prefixed like all MooreItems localStorage keys; "accepted"/"declined" values enable clean boolean checks; returning visitors silently skip banner (Session 27)
94. **Full refund only over partial** — 99% of real refund cases are full refunds; adding partial amount input adds complexity with minimal real-world benefit; can always add later if needed (Session 27)
95. **Stripe live key required to refund live orders** — sk_test_... cannot reach live payment intents; local .env.local must use sk_live_... for refund testing on real orders; worth documenting as a gotcha (Session 27)

---

## Bugs / Issues to Address

1. ~~**Home & Garden bloated** — 1,417 products~~ ✅ RESOLVED (split into 5+ categories)
2. ~~**Admin orders page** — not wired to real data~~ ✅ RESOLVED (RLS bypass via admin client, Session 14)
3. **Admin sync route broken** — use standalone scripts
4. ~~**Test orders in database** — clean up before launch~~ ✅ RESOLVED (9 orders + 10 items deleted)
5. ~~**metadataBase warning** — Next.js metadata.metadataBase not set~~ ✅ RESOLVED (set to https://www.mooreitems.com)
6. ~~**CJ balance $0** — order pipeline complete but can't process real orders~~ ✅ RESOLVED (pay-per-order with PayPal/credit card, Session 12)
7. **Emails going to spam** — expected with Gmail sender, improves with domain-based sending and reputation
8. **Google OAuth consent screen** — shows "continue to auth.mooreitems.com" (acceptable with custom domain)
9. **MegaMenu duplicate product preview fetches** — home-furniture, fashion, jewelry each called twice (minor, cosmetic)
10. ~~**Stripe webhook not in dashboard** — only works via Stripe CLI locally~~ ✅ RESOLVED (production webhook at mooreitems.com)
11. ~~**Pre-existing TypeScript error** — `app/admin/customers/page.tsx` has type mismatch~~ ✅ RESOLVED (all 17 TS errors fixed)
12. ~~**Price mismatch between product cards and detail pages** — build-time caching showed stale prices~~ ✅ RESOLVED (force-dynamic on all 8 pages, Session 11)
13. ~~**Uncategorized products showing in best sellers**~~ ✅ RESOLVED (314 recategorized via keyword + AI, Session 11)
14. ~~**Dirty product names** — shipping instructions, platform refs in names~~ ✅ RESOLVED (131 AI-cleaned + 1,643 bulk polished, Session 11-12)
15. ~~**Image gallery showing wrong main image** — variant auto-select hijacking gallery on load~~ ✅ RESOLVED (hasInitialized ref, Session 11)
16. ~~**~50% of variants missing color/size data**~~ ✅ RESOLVED (8,269 variants enriched from names, Session 11)
17. ~~**~9,643 variants still missing color/size** — CJ SKU codes with no parseable data, plus unmatched patterns~~ ✅ MOSTLY RESOLVED (95.1% of 28,104 variants now have data — remaining ~1,375 are unparseable CJ SKU codes, Session 17)
18. ~~**Variant size selectors unsorted** — ring sizes show as 12, 9, 7... instead of sequential order~~ ✅ RESOLVED (smart sorting in VariantSelector, Session 12)
19. ~~**Import pipeline doesn't extract variant color/size** — `enrich-us-products.js` stores in name only~~ ✅ RESOLVED (shared variant-parser.ts, Session 12)
20. ~~**CJ fulfillment error 1603000** — "Order create fail"~~ ✅ RESOLVED (debug logging added, payload verified, Session 13)
21. ~~**CJ fulfillment error 1604000** — "Balance insufficient"~~ ✅ RESOLVED (orders still created in CJ dashboard, pay manually with credit card, Session 13)
22. ~~**CJ shipping address missing phone** — fallback '0000000000' sent to CJ~~ ✅ RESOLVED (phone_number_collection added to Stripe checkout, Session 13)
23. ~~**Admin dashboard showing zero orders** — RLS blocking admin from seeing all orders~~ ✅ RESOLVED (admin service role client, Session 14)
24. ~~**Admin customers page showing zero** — same RLS issue~~ ✅ RESOLVED (admin client API route, Session 14)
25. ~~**Recently viewed showing stale images** — localStorage cached full product data including old image URLs~~ ✅ RESOLVED (store IDs only, fetch fresh data, Session 14)
26. ~~**Homepage hero showing same 4 products** — hardcoded category queries~~ ✅ RESOLVED (randomized from top 24 best sellers, Session 14)
27. ~~**1,252 orphaned products with no variants** — 41% of catalog had products customers could browse but not purchase~~ ✅ RESOLVED (8,001 variants created from CJ raw data, Session 15)
28. ~~**2,667 zero-stock variants** — silently blocking checkout for affected products~~ ✅ RESOLVED (bulk updated to 100, import pipeline hardened, Session 15)
29. ~~**10 delisted CJ products still active** — products removed from CJ but still showing in store~~ ✅ RESOLVED (set to out_of_stock, checkout validation added, Session 15)
30. ~~**20 products missing descriptions** — blank product detail pages~~ ✅ RESOLVED (AI-generated via Claude Haiku, Session 15)
31. ~~**Health check false positives** — Supabase 1,000-row limit causing incorrect orphaned product counts~~ ✅ RESOLVED (fetchAll() pagination helper, Session 15)
32. ~~**Weight data reported as missing** — 963 products with range-format weights like "1.00-912.00" failed Number() parse~~ ✅ RESOLVED (switched to parseFloat(), Session 15)
33. ~~**Stale pending orders cluttering admin** — abandoned checkouts created pending orders that never completed~~ ✅ RESOLVED (auto-cleanup after 48 hours via tracking sync cron, Session 16)
34. ~~**All review counts showing 34** — bulk polish script set identical review counts~~ ✅ RESOLVED (randomized by price tier: 8-35, 4-20, 1-12, Session 16)
35. ~~**Compare-at prices unrealistically high** — 1.8-2.2x multiplier made "was" prices look fake~~ ✅ RESOLVED (reduced to 1.3-1.6x, Session 16)
36. ~~**Digital products showing "Only X left" urgency** — unlimited downloads shouldn't show stock scarcity~~ ✅ RESOLVED (urgency badges hidden for digital products, Session 16)
37. ~~**"Ships in 2-5 days" messaging** — should say "Delivered in" since that's what customers care about~~ ✅ RESOLVED (updated sitewide, Session 16)
38. ~~**6 products with promotional text in names** — "New Product", "Top Sale", "New Style" prefixes flagged by Google Merchant Center~~ ✅ RESOLVED (cleaned via SQL, Session 16)
39. **Google Merchant Center products under review** — ~2,840 products awaiting approval after setup completion, 322 "image not processed" (auto-resolves in 3 days)
40. ~~**No daily CJ stock sync** — all variant stock_count hardcoded to 100, never syncs with CJ actual inventory.~~ ✅ RESOLVED (real-time CJ webhook system — STOCK/VARIANT events update variants automatically, product cascade to out_of_stock when all variants depleted, Session 18)
41. ~~**Invalid variant combos orderable** — customers could select non-existent color+size combos and order wrong products~~ ✅ RESOLVED (availability matrix + greyed-out selectors + add-to-cart protection, Session 17)
42. ~~**Widespread miscategorization from keyword imports** — "crystal" → Jewelry (car wax), "USB" → Electronics (bed frames), "silver" → Jewelry (exhaust manifolds), "ring" → Jewelry (office chairs)~~ ✅ RESOLVED (4-pass AI audit: 225 recategorized, 167 junk hidden, 172 rescued from hidden, Session 19)
43. ~~**Skeleton grid mismatch on category pages** — loading skeletons used 4-column grid while actual ProductGrid uses 3 columns~~ ✅ RESOLVED (changed lg:grid-cols-4 to lg:grid-cols-3, Session 19)
44. ~~**Infinite scroll error loop** — page 2+ fetch errors didn't reset hasMore flag, causing infinite retry attempts~~ ✅ RESOLVED (added setHasMore(false) in error branch, Session 19)
45. ~~**172 legitimate products wrongly hidden** — office desks, jewelry, sofas, tools hidden as "junk" when they just needed correct categories~~ ✅ RESOLVED (AI audit identified, names cleaned, reactivated into correct categories, Session 19)
46. **~450 borderline category placements** — AI audits flagged items that could go in multiple categories (shoe racks in Fashion vs Storage, camping stoves in Sports vs Garden); not customer-impacting since search handles edge cases
47. **792 single-image products** — CJ only provided 1 photo; displays fine but less compelling than multi-image listings

---

## Important Links

- **Live Site:** https://www.mooreitems.com
- **GitHub Repo:** https://github.com/tibbyy05/Moore-Items
- **Netlify Dashboard:** https://app.netlify.com (mooreitems deployment)
- **Google Analytics:** https://analytics.google.com (MooreItems.com property, G-23H54T894J)
- **Google Search Console:** https://search.google.com/search-console (mooreitems.com)
- **Google Merchant Center:** https://merchants.google.com (~2,840 products under review, fully configured shipping/returns)
- **Google Merchant Feed:** https://www.mooreitems.com/api/feeds/google-merchant
- **Meta Events Manager:** https://business.facebook.com/events_manager (MooreItems Pixel, ID: 2064810427703961)
- **Meta Business Suite:** https://business.facebook.com (MooreItems portfolio)
- **Instagram:** https://www.instagram.com/mooreitems
- **Facebook:** https://www.facebook.com/profile.php?id=61575170498498
- **TikTok:** https://www.tiktok.com/@mooreitems
- **LinkedIn:** https://www.linkedin.com/company/mooreitems
- **Cron-job.org:** https://cron-job.org (MooreItems Tracking Sync — every 4 hours, Catalog Health Check — daily 3 AM)
- CJ Dashboard: https://cjdropshipping.com/my.html#/dashboard
- CJ API Docs: https://developers.cjdropshipping.com/en/api/start/
- Supabase Dashboard: https://supabase.com/dashboard/project/vjiybpiuquttbaimywbt
- Stripe Dashboard: https://dashboard.stripe.com
- Anthropic Console: https://console.anthropic.com
- SendGrid Dashboard: https://app.sendgrid.com
- Google Cloud Console: https://console.cloud.google.com (MooreItems OAuth)
- Ai-genda.com: https://ai-genda.com

---

## Session History

### Session 1 (Feb 18): Catalog Foundation
- 999 US products categorized, names cleaned, CN products removed

### Session 2 (Feb 18-19): Order Pipeline
- Built Stripe webhook → CJ fulfillment with USPS+ logistics
- Debugged CJ order creation (fromCountryCode, logisticName, wareHouseCountryCode)
- Test order successful, fails on $0 CJ balance (expected)

### Session 3 (Feb 19): Token Caching, Reviews V2, Catalog Expansion
- CJ auth token globalThis caching (survives hot reloads)
- Combined verify endpoint (product + stock in one call)
- Review system V2 (varied counts, realistic names)
- Catalog expanded to 3,204 products (pages 11-30)
- Subcategory tag filters on category pages
- UI: wider grids, badge removal, image gallery lightbox

### Session 4 (Feb 19): Storefront Redesign & AI Assistant
- Homepage redesign (hero, categories, best sellers, deals, value props)
- Visual mega menu with product previews
- Live search with suggestions
- AI Shopping Assistant (Claude-powered, Ai-genda branding)
- 7 policy/info pages + full footer redesign
- Reviews V3 (all 4-5 stars, dates within 60 days)
- Product cleanup (113 junk hidden, 509 flagged)
- Mobile optimization pass
- Infinite scroll, sticky add-to-cart, DescriptionFormatter
- Category product_count populated

### Session 5 (Feb 20): SendGrid Email Integration
- SendGrid account configured (free tier: 100 emails/day)
- Domain authentication for www.mooreitems.com (6 DNS records)
- Single sender verified (mooreitemsshop@gmail.com)
- Email templates V5 full-bleed layout (edge-to-edge backgrounds)
- Stripe webhook integrated with order confirmation emails
- Database columns added: email_sent_at, shipping_email_sent_at

### Session 6 (Feb 20): Product Cleanup & Optimization
- Product name cleanup: 496 renames + 46 hidden
- Color variant image switching implemented
- Infinite scroll pagination optimized (variants stripped, images trimmed, skip count on page 2+)
- Shopping assistant API key fix (ANT_API_KEY → ANTHROPIC_API_KEY)

### Session 7 (Feb 21): Shipping, Auth & Customer Accounts
- Scrolling ticker banner replacing static announcement bar
- All shipping times updated 3-7 → 2-5 business days across codebase
- Shipping callouts: green badge on product pages, truck icon on cards, cart reassurance banner
- Customer auth: email/password signup + Google OAuth
- Supabase custom domain: auth.mooreitems.com (CNAME + TXT verified)
- Google OAuth with MooreItems consent screen branding
- Auth callback fixed (@supabase/ssr replacing auth-helpers)
- Database trigger: handle_new_user() auto-creates mi_customers
- Supabase SMTP configured via SendGrid
- MooreItems-branded confirmation email template
- My Account section: layout with sidebar, dashboard, order history, order detail with status timeline
- Wishlist synced to database with localStorage fallback
- Saved Addresses page with CRUD + default selection
- Account Settings: profile info, email change, password change
- RLS policies for orders, order items, wishlists, addresses

### Session 8 (Feb 21): Category Restructure, Performance & Pricing
- Category restructure 8 → 12 with keyword bucket analysis
- Recategorization script (~1,800 products reassigned)
- UI updates (product counts removed, 4×3 category grid)
- Subcategory tags centralized
- Category images generated and compressed (80MB → 1.7MB)
- Shared providers (AuthProvider, CategoriesProvider, WishlistProvider)
- Performance optimizations (slim queries, batch size 24, skeleton loading)
- Infinite scroll fixed across all pages
- Admin Pricing Controls with centralized config

### Session 9 (Feb 23): Digital Products, Claude Code & Developer Infrastructure
- **Claude Code installed** — terminal AI dev tool with full project access
- **Git + GitHub** — version control initialized, pushed to tibbyy05/Moore-Items
- **Security fix** — CJ API token scrubbed from git history, key rotated
- **Add Product page** — two tabs (Manual Product + CJ Import)
- **CJ Import improvements** — preview, US warehouse detection via stock API, duplicate check
- **Edit Product page** — full edit form for any product type
- **AI Review Generation** — Claude Haiku per-product generation via admin
- **Smart fulfillment routing** — CJ/digital/mixed order handling in webhook
- **Digital product system** — complete end-to-end:
  - File upload to private Supabase Storage bucket
  - Digital-aware checkout ($0 shipping, skip address)
  - Instant delivery (fulfillment_status: 'delivered' on payment)
  - Secure downloads (signed URLs, HMAC tokens for guests)
  - Download buttons on confirmation page + order history + email
  - Cart/storefront digital awareness (violet badges, messaging)
  - Mixed cart support (physical ships, digital downloads)
- **Guest order access** — lookup page + email-based order matching
- **Order history fix** — server API routes bypass RLS
- **Stripe CLI** — local webhook forwarding configured
- **First digital product** — Kids Printable Activity Bundle ($4.99)

### Session 10 (Feb 24-25): Admin Cleanup, Polish, Production Launch & SEO
- **Admin dashboard cleanup:**
  - Sidebar grouped (STORE/OPERATIONS/TOOLS/COMING SOON), Settings removed
  - Dashboard: fake percentages removed, Needs Polish stat (violet), Quick Actions row
  - Products: pagination fixed, Import CSV removed
  - Analytics: fake data removed, empty columns removed
  - Landing Pages + Ad Campaigns: Coming Soon badges, dead buttons disabled
- **AI Product Polish feature:**
  - API route (Sonnet for name/description/category, Haiku for reviews)
  - PolishModal component (3 states: Ready/Loading/Results, accept/reject per field)
  - Wired to products page (Sparkles button per row, Needs Polish indicator)
- **Edit Product improvements:**
  - Image reorder controls (thumbnails, position badges, star/arrows/remove)
  - Image save bug fixed (hasFetched guard)
- **17 TypeScript errors fixed** across 11 files
- **Production deployment:**
  - Netlify: connected GitHub, env vars, build successful
  - DNS: A record → 75.2.60.5, CNAME www → mooreitems.netlify.app
  - Stripe: switched to live mode, production webhook at mooreitems.com (non-www)
  - Supabase: Site URL updated, auth redirects added
  - Google OAuth: production origins + redirects configured
  - First live transaction: $13.98 (necklace + shipping), refunded
  - Test orders cleaned up (9 orders + 10 items)
- **Bug fixes shipped:**
  - Stripe checkout shipping label: 2-5 business days
  - Deterministic product sorting (tiebreaker by id)
  - Shop filter URL sync (back button preserves filters)
  - Product API: added missing warehouse field
  - CJ variant stock: uses is_active instead of stock_count for CJ products
  - Cart trust badges: compact horizontal layout, no overflow
  - metadataBase warning resolved
- **SEO:**
  - Google Search Console verified (DNS TXT)
  - Dynamic sitemap (app/sitemap.ts) + robots.txt (app/robots.ts)
  - Sitemap submitted: 3,073 pages discovered
  - Homepage confirmed indexed
- **Google Analytics GA4:**
  - Account + property created (MooreItems.com)
  - Measurement ID: G-23H54T894J
  - Tracking script in app/layout.tsx (next/script afterInteractive)
  - Enhanced measurement ON, realtime data confirmed
- **Weight data enrichment:**
  - Created fetch-weights.js (CJ detail API for productWeight/packingWeight)
  - ~1,120 products enriched, ~1,900 remaining
  - Token refresh fix added for long runs
- **Excel export:**
  - Created export-products-excel.js
  - Full product data with weight, inventory, margins
  - Output: scripts/output/mooreitems-master-product-list.xlsx

### Session 11 (Feb 25): Data Quality Sweep, Image Fix, Variant Enrichment
- **Stale price fix:**
  - Added `export const dynamic = 'force-dynamic'` to all 8 storefront pages
  - Prevents Next.js/Netlify build-time caching from showing stale prices
  - Pages: homepage, shop, category, trending, deals, new-arrivals, search, product detail
- **Product recategorization:**
  - `recategorize-all.js` caught 255 products via keyword matching
  - Built `ai-categorize-remaining.js` — Claude Haiku categorized remaining 59 products
  - 17 junk products auto-hidden by AI (car parts, packaging, industrial items)
  - Zero uncategorized products remaining
  - Category product_count updated in database
- **Product name cleanup:**
  - Built `ai-clean-names.js` — Claude Haiku rewrites dirty CJ names
  - 133 dirty names found (shipping instructions, platform refs, dimensions, specs)
  - 131 successfully cleaned, 2 failed (slug conflicts from duplicate names)
- **Image gallery order bug:**
  - Root cause: variant change useEffect fired on page load, setting galleryIndex to 10
  - Variant 0's image_url pointed to a different image than product.images[0]
  - Debug: traced DB → ImageGallery → dedup (all correct), found variant auto-select was the culprit
  - Fix: `hasInitialized` ref blocks variant useEffect for 500ms after product load
  - Also fixed: product images now always come before variant images in gallery array
  - TypeScript build error fixed (filter type mismatch)
- **Variant data enrichment:**
  - Built `check-variant-patterns.js` — analyzed 20,103 variants across 4 data states
  - Found ~50% of variants missing color and/or size data
  - Root cause: `enrich-us-products.js` stores variant info in name field but doesn't parse into color/size columns
  - Built `extract-variant-data.js` — parses variant names, strips product name prefix, matches against 100+ known colors and size patterns
  - 8,201 variants updated (4,976 color only, 2,037 size only, 1,188 both)
  - Added ordinal ring size support (6th, 7th, 8th → 6, 7, 8) — 68 more sizes extracted
  - Total: 8,269 variants enriched
  - Product pages now show proper color swatches and size selectors
  - ~9,643 variants still missing data (CJ SKU codes with no parseable info)
- **Pipeline gap identified:**
  - `enrich-us-products.js` needs update to extract color/size during import
  - Admin CJ import route needs verification for color/size mapping
  - Variant size selectors need sorting (currently unordered)

### Session 12 (Feb 26): Ad Infrastructure, Import Pipeline Fix, Catalog Polish
- **Variant size selector sorting:**
  - Smart sort function in VariantSelector.tsx: numeric ascending, clothing XS→4XL, shoe sizes, alphabetical fallback
  - TypeScript fix: filter undefined values before sorting
- **Import pipeline fix:**
  - Created shared `lib/utils/variant-parser.ts` with `parseVariantColorSize()`
  - Updated `scripts/enrich-us-products.js` to use shared parser
  - Updated `app/api/admin/products/import-cj/route.ts` to use shared parser
  - Aggressive product name prefix stripping, per-segment parsing, size word normalization
  - Pipeline gap from Session 11 fully resolved
- **Meta Pixel installed:**
  - Created Meta Business Portfolio ("MooreItems")
  - Pixel ID: 2064810427703961
  - Created `components/MetaPixel.tsx` with Next.js Script component
  - Added to `app/layout.tsx` alongside GA4
  - Events: PageView (all pages), ViewContent (product pages), AddToCart (cart provider), Purchase (confirmation page)
  - TypeScript declarations in `types/global.d.ts`
  - Env var: `NEXT_PUBLIC_META_PIXEL_ID=2064810427703961` (local + Netlify)
  - Automatic advanced matching enabled
  - All events verified firing in Meta Events Manager Test Events tab
- **Weight enrichment:**
  - Ran `fetch-weights.js` — 986 more products enriched (~2,900 total)
  - 127 remaining hit CJ daily rate limit, likely discontinued products
- **Bulk product polish:**
  - Created `scripts/bulk-polish.js` — resumable batch AI cleanup
  - Uses Claude Haiku for cost efficiency
  - Processes: name cleanup, description rewrite (2-3 paragraphs marketing copy), review generation
  - Progress tracking via `scripts/.bulk-polish-progress.json` (resumable)
  - Supports --dry-run and --reset flags
  - Result: 1,643 products polished, 21 skipped, 0 errors
  - Every active product now has reviews (zero products with review_count = 0)
- **CJ funding resolved:**
  - Discovered CJ supports pay-per-order (PayPal, credit card, Stripe, Klarna)
  - No wallet pre-funding or Payoneer setup needed
  - Order pipeline fully operational for real orders

### Session 13 (Feb 26-27): Order Validation, Conversion Optimization & First Revenue
- **Order pipeline tested end-to-end on live site:**
  - Test order MI-1772133487179-0WAORA: Stripe succeeded, email sent, CJ failed with error 1603000 ("Order create fail")
  - Added debug logging to `lib/cj/client.ts` and `lib/cj/fulfill-order.ts` for full API payload/response capture
  - Second order failed with 1604000 ("Balance insufficient") — but order appeared in CJ dashboard awaiting payment
  - Discovered CJ workflow: API creates order → shows in CJ dashboard → pay with credit card → CJ ships
- **CJ Wallet / Payoneer investigation:**
  - CJ wallet top-up only accepts Payoneer or Wire Transfer ($2,000 minimum)
  - Payoneer account approved but had "no linked dollar account" error
  - CJ agent Ruth confirmed pay-per-order works directly in dashboard
- **Phone number collection fix:**
  - Added `phone_number_collection: { enabled: true }` to Stripe checkout (`app/api/checkout/route.ts`)
  - Webhook captures `session.customer_details?.phone` and stores on order
  - CJ fulfillment (`lib/cj/fulfill-order.ts`) uses real phone instead of '0000000000' fallback
- **First successful revenue order:**
  - Order MI-1772146672690-4WGL6H: $14.33 customer payment, $6.43 CJ cost, ~$7.18 profit (~50% margin)
  - Paid and submitted to CJ for shipping
- **Email capture popup:**
  - Created `mi_email_subscribers` table (email, source, subscribed_at, is_active)
  - WELCOME10 discount code (10% off, no minimum)
  - Component: `components/storefront/EmailPopup.tsx`
  - Shows after 10s delay, localStorage key `mi_popup_dismissed` prevents repeats
  - Excluded from /admin, /login, /signup, /checkout pages
  - Navy (#0f1629) background with gold (#c8a45e) accents, success state with copy button
  - API route: `app/api/subscribe/route.ts` (validates email, upserts to Supabase)
- **Abandoned cart recovery:**
  - Stripe webhook updated to handle `checkout.session.expired` events (fires 24hr after session creation)
  - Email template: `lib/email/templates/abandoned-cart.ts`
  - Shows product images and names, includes SAVE10 discount code (10% off)
  - CTA: "Complete Your Order" → /cart
  - Webhook looks up order by stripe_session_id, sends email if payment_status still 'pending'
  - Prevents duplicate sends, adds note to order
  - SAVE10 discount code created in mi_discount_codes
  - Added `checkout.session.expired` to Stripe production webhook endpoint
- **Urgency signals on product pages:**
  - "X people viewing this" counter: random 3-25 on load, fluctuates ±1-3 every 30s (physical products only)
  - Low stock badge: real count if stock_count ≤ 20, deterministic hash shows "Only X left" (3-15) for ~15% of products
  - "X sold in last 24 hours": formula based on review_count, capped at 15 (physical products only)
  - Product cards also show low stock badges (hidden for digital products)
- **n8n automation architecture planned:**
  - Daily trending product scout: Google Trends → Reddit → AI keyword extraction → Supabase catalog matching → email digest
  - Architecture defined, ready for implementation in dedicated session

**Key files modified in Session 13:**
- `app/api/checkout/route.ts` — phone number collection
- `app/api/webhooks/stripe/route.ts` — phone capture, abandoned cart handler (`checkout.session.expired`)
- `app/api/subscribe/route.ts` — email capture API (NEW)
- `lib/cj/client.ts` — debug logging
- `lib/cj/fulfill-order.ts` — phone field fix, debug logging
- `lib/email/templates/abandoned-cart.ts` — abandoned cart email template (NEW)
- `lib/email/sendgrid.ts` — `sendAbandonedCartEmail()` function
- `components/storefront/EmailPopup.tsx` — email popup component (NEW)
- `components/storefront/ProductCard.tsx` — low stock urgency badge
- `app/product/[slug]/page.tsx` — viewer counter, low stock, sold count urgency signals
- `scripts/sql/mi_email_subscribers.sql` — email subscribers table (NEW)
- `scripts/sql/discount-save10.sql` — SAVE10 discount code (NEW)

### Session 14 (Feb 27-28): Comprehensive SEO, Google Shopping, Admin Fixes & Automation
- **SEO Phase 1 — Technical Foundation:**
  - JSON-LD structured data: Product (price, availability, aggregateRating, SKU), BreadcrumbList, Organization, WebSite with SearchAction
  - Server component wrappers with `generateMetadata` for unique per-page titles, descriptions, canonical URLs, OG tags with product images, Twitter cards
  - Price meta tags (product:price:amount, product:price:currency)
  - `React.cache()` for deduplication between generateMetadata and page component
  - Fixed base URL consistency (www.mooreitems.com everywhere)
  - New files: `lib/seo/constants.ts`, `lib/seo/fetchers.ts`, `lib/seo/json-ld.tsx`
  - Refactored: product and category pages split into server wrapper + client component
- **SEO Phase 2 — On-Page Product SEO:**
  - Image alt text: position-based descriptive text in ImageGallery, thumbnails, lightbox, ProductCard
  - Heading hierarchy: fixed H3→H2 on category pages to avoid skipping levels
  - Breadcrumb styling: warm colors, gold hover, ">" separators
  - Meta descriptions: `truncateAtWord()` cuts at last complete word before 160 chars
  - Noindex for filtered URLs: middleware adds X-Robots-Tag for /shop with query params (except ?page=N)
- **SEO Phase 3 — Category Pillar Pages:**
  - Added `description` (text) and `faq_json` (jsonb) columns to mi_categories
  - Populated all 13 categories with 150-250 word SEO descriptions and 3-4 FAQ items
  - FAQ accordion sections displayed below product grids
  - CollectionPage + FAQPage JSON-LD schemas on every category page
- **SEO Phase 5 — Sitemap & Performance:**
  - Enhanced sitemap (`app/sitemap.xml/route.ts`): image tags, lastmod, changefreq, priority, paginated category URLs, 6hr cache
  - Custom 404 page: search bar, 8 category links with Lucide icons, "Back to Home" CTA
  - PaginationHead component: `<link rel="prev/next">` on listing pages
  - All 5 listing pages support ?page=N for pagination SEO
  - Homepage hero images have `fetchpriority="high"`
- **SEO Phase 6 — Google Merchant Center:**
  - Google product category mapping (`lib/seo/google-categories.ts`) — 12 slugs → Google taxonomy IDs
  - Product feed (`app/api/feeds/google-merchant/route.ts`) — RSS 2.0 XML, 6hr cache, batched Supabase fetching
  - XML escaping fix — strip control characters (0x00-0x1F) preventing "PCDATA invalid Char" errors
  - Google Merchant Center account created, domain verified and claimed
  - Feed URL added with daily fetch schedule
  - **3,030 products approved** — live in Google Shopping for free
  - robots.txt updated: feed URL in sitemaps, /api/feeds/google-merchant explicitly allowed
- **Social media profiles:**
  - Created Instagram, Facebook, TikTok, LinkedIn pages for MooreItems
  - Installed `react-icons` for official brand icons (FaInstagram, FaFacebookF, FaTiktok, FaLinkedin)
  - Updated footer with real profile URLs and official icons
- **Homepage hero randomization:**
  - Replaced 5 hardcoded per-category queries with 1 query fetching top 24 best sellers
  - Fisher-Yates shuffle picks 4 random products on each server render
  - Reduced 5 sequential Supabase queries to 1
- **Recently viewed fix:**
  - Changed from caching full product data to storing only product IDs + timestamps in localStorage
  - Component fetches fresh product data from API when rendering
  - Deleted products silently skipped
- **Admin dashboard RLS fix:**
  - Root cause: dashboard used browser anon client, orders API used user session — both subject to RLS
  - Created `/api/admin/dashboard/route.ts` — verifies admin auth, queries with admin service role client
  - Dashboard fetches from API instead of direct Supabase calls
  - Parallel queries via Promise.all for better performance
- **Admin dashboard time filter:**
  - Dropdown: Today, This Week, Last Week, This Month, Last Month, This Quarter, All Time
  - Revenue, orders, conversion rate update based on selected time range
- **Admin customers page RLS fix:**
  - Created `/api/admin/customers/route.ts` using admin client to bypass RLS
- **Manual order controls:**
  - Fulfillment status dropdown (processing, shipped, delivered, unfulfilled)
  - Tracking number input field
  - Save Changes and Clear Notes buttons
  - Updates order via admin client
- **Automated tracking sync:**
  - Created `/api/admin/orders/sync-tracking/route.ts`
  - Finds orders with fulfillment_status = processing and CJ order number in notes
  - Calls CJ API to check tracking status
  - Updates tracking_number, fulfillment_status to shipped/delivered
  - Auto-sends shipping email if shipping_email_sent_at is null
  - Dual auth: secret key via ?key= param for cron, or admin session auth
  - Admin "Sync Tracking" button on orders page
- **Cron job setup:**
  - cron-job.org account created
  - POST to `https://mooreitems.com/api/admin/orders/sync-tracking?key=mooretrack2026`
  - Runs every 4 hours
  - `TRACKING_SYNC_SECRET` env var set in Netlify
- **First organic Google impression:**
  - 1 impression in Google Search Console (average position 79) — first stranger finding site via Google
- **Google Analytics stats:**
  - 18 users, 19 new users, 307 events in first 3 days since launch

**Key files created/modified in Session 14:**
- `lib/seo/constants.ts` — SEO constants (NEW)
- `lib/seo/fetchers.ts` — SEO data fetchers with React.cache() (NEW)
- `lib/seo/json-ld.tsx` — JSON-LD schema components (NEW)
- `lib/seo/google-categories.ts` — Google product category mapping (NEW)
- `app/api/feeds/google-merchant/route.ts` — Google Merchant feed (NEW)
- `app/api/admin/dashboard/route.ts` — Admin dashboard stats API (NEW)
- `app/api/admin/customers/route.ts` — Admin customers API (NEW)
- `app/api/admin/orders/sync-tracking/route.ts` — Tracking sync API (NEW)
- `app/sitemap.xml/route.ts` — Enhanced sitemap (NEW, replaced app/sitemap.ts)
- `app/not-found.tsx` — Custom 404 page (NEW)
- `components/seo/PaginationHead.tsx` — Pagination SEO component (NEW)
- `app/product/[slug]/page.tsx` — Server wrapper with generateMetadata (REWRITTEN)
- `app/product/[slug]/ProductPageClient.tsx` — Client component extracted (NEW)
- `app/category/[slug]/page.tsx` — Server wrapper with generateMetadata (REWRITTEN)
- `app/category/[slug]/CategoryPageClient.tsx` — Client component extracted (NEW)
- `app/layout.tsx` — Added Organization + WebSite JSON-LD (UPDATED)
- `app/page.tsx` — Randomized hero products (UPDATED)
- `app/robots.ts` — Added feed URL (UPDATED)
- `middleware.ts` — Added noindex for filtered URLs (UPDATED)
- `components/storefront/ImageGallery.tsx` — Added alt text (UPDATED)
- `components/storefront/ProductCard.tsx` — Added alt text (UPDATED)
- `components/storefront/RecentlyViewed.tsx` — Fetch fresh data (REWRITTEN)
- `components/layout/Footer.tsx` — Official brand social icons + real profile URLs (UPDATED)
- `app/admin/page.tsx` — Fetches from dashboard API, time filter (REWRITTEN)
- `app/admin/orders/page.tsx` — Manual controls, Sync Tracking button (UPDATED)
- `app/api/admin/orders/route.ts` — Uses admin client for RLS bypass (UPDATED)
- 7 static pages — Added unique metadata exports (UPDATED)

### Session 15 (Feb 28): Catalog Health Monitor, Inventory Protection & Data Quality
- **CJ checkout validation:**
  - Checkout route (`app/api/checkout/route.ts`) now calls CJ inventory API for each CJ product
  - Blocks Stripe session creation if CJ reports product delisted or 0 stock
  - Returns clear error message with product name so customer knows what's unavailable
- **Delisted product cleanup:**
  - 10 CJ products found delisted during weight sync — set to `status: 'out_of_stock'`
  - 2 junk products hidden: "Home Slippers Couples Feel Cool Stepping On Excrement" + adult product
  - Kids Printable Activity Bundle (digital, no CJ PID) set to hidden (incomplete — no price/image)
- **Zero-stock variant fix:**
  - 2,667 variants had stock_count = 0 — bulk updated to 100
  - Root cause: import scripts weren't setting stock_count on variant creation
  - Hardened all 3 import paths: `import-cj/route.ts`, `lib/cj/sync.ts`, `enrich-us-products.js` — all now force stock_count = 100
- **Orphaned products fix (major):**
  - Discovered 1,252 active products (41% of catalog) with zero variants in mi_product_variants
  - Customers could browse these products but never add to cart or purchase
  - Root cause: enrichment script stored variant data in cj_raw_data but never created mi_product_variants rows
  - Built `scripts/fix-orphaned-variants.js` — reads cj_raw_data.variants, creates variant rows using shared variant-parser.ts
  - Result: 8,001 variants created for 1,252 products, zero errors
  - Digital products get "Digital Download" variant with stock_count 9999
  - Products with empty variants array get single "Default" variant
- **Missing descriptions fix:**
  - 20 products found with NULL/empty descriptions
  - Built `scripts/fix-missing-descriptions.js` — Claude Haiku generates 2-3 paragraph marketing copy
  - 18/20 succeeded, 2 skipped (junk product names → hidden instead)
- **Catalog health monitor:**
  - Created `app/api/admin/catalog/health-check/route.ts` with 10 automated checks
  - Checks: zero-stock variants (HIGH, auto-fix), missing images (HIGH), missing category (HIGH), pricing issues (HIGH), orphaned products (HIGH), missing reviews (MEDIUM), missing description (MEDIUM), missing weight (LOW), category count drift (LOW, auto-fix), stale pending (LOW)
  - Health score formula: `Math.round((1 - needs_attention / total_active_products) * 100)`
  - Dual auth: secret key via `?key=` param for cron, or admin session auth
  - Supabase pagination: `fetchAll()` helper paginates in batches of 1,000 (critical fix — without this, Supabase default 1,000 row limit caused massive false positives)
- **Admin catalog health page:**
  - Created `app/admin/catalog-health/page.tsx`
  - Health score with color coding (green 95%+, amber 80-95%, red <80%)
  - Manual "Run Health Check" button
  - Expandable check cards grouped by severity
  - Links to edit affected products
  - Added to admin sidebar under TOOLS group
- **Health check email alerts:**
  - Created `lib/email/templates/health-check.ts` — branded template matching MooreItems design
  - Added `sendHealthCheckAlert()` to `lib/email/sendgrid.ts`
  - Email includes: health score, auto-fixed summary, flagged issues with product names (up to 10 per check), CTA to admin dashboard
  - Fire-and-forget: doesn't block API response, errors logged but don't fail the check
  - Only sends when issues found — 100% health = no email (no daily noise)
- **Weight data parsing fix:**
  - Health check reported 963 products missing weight, but all 3,018 CJ products had data
  - Root cause: CJ productWeight stored as range strings like "1.00-912.00" — `Number()` returns NaN, `parseFloat()` correctly extracts first number
  - Fix applied to health check route
- **Daily cron job:**
  - cron-job.org: "MooreItems Catalog Health Check"
  - URL: `POST https://mooreitems.com/api/admin/catalog/health-check?key=moorehealth2026`
  - Schedule: Daily at 3:00 AM EST (America/New_York timezone)
  - `HEALTH_CHECK_SECRET=moorehealth2026` set in both .env.local and Netlify
- **Promo code management:**
  - Admin promo codes page with influencer tracking
  - SQL migration for usage tracking, payout calculations, scheduling
  - Stripe webhook integration for usage stats
- **Unified import pipeline spec:**
  - Wrote comprehensive spec for future single-command product import
  - 8-stage pipeline: import → enrich → variants → categorize → clean → price → reviews → validate
  - Products start as 'pending', only go 'active' after passing all validation checks
  - Not implemented this session — prioritized health monitor to protect existing catalog
- **Health score progression:** 55% → 67% → 68% → **100%** (all checks clear)

**Key files created/modified in Session 15:**
- `app/api/admin/catalog/health-check/route.ts` — Catalog health monitor with 10 checks, dual auth, email alerts (NEW)
- `app/admin/catalog-health/page.tsx` — Admin health dashboard with score visualization (NEW)
- `lib/email/templates/health-check.ts` — Health check alert email template (NEW)
- `lib/email/sendgrid.ts` — Added sendHealthCheckAlert() export (UPDATED)
- `scripts/fix-orphaned-variants.js` — Create variants for 1,252 orphaned products (NEW)
- `scripts/fix-missing-descriptions.js` — Generate descriptions via Claude Haiku (NEW)
- `components/admin/Sidebar.tsx` — Added Catalog Health nav link (UPDATED)
- `app/api/checkout/route.ts` — Added CJ stock validation before Stripe session (UPDATED)
- `app/api/admin/products/import-cj/route.ts` — Hardened variant stock_count to 100 (UPDATED)
- `lib/cj/sync.ts` — Hardened variant stock_count to 100 (UPDATED)
- `scripts/enrich-us-products.js` — Hardened variant stock_count to 100 (UPDATED)

### Session 16 (Feb 28): Admin Cleanup, Catalog Curation & Google Merchant Setup
- **Stale pending order cleanup:**
  - Admin dashboard showed 9 pending orders from test checkouts that never completed payment
  - Orders are created at "Proceed to Checkout" (before Stripe payment) — by design for abandoned cart recovery
  - Added auto-cleanup to `app/api/admin/orders/sync-tracking/route.ts` — deletes pending orders > 48 hours old
  - Deletes mi_order_items first (foreign key), then mi_orders
  - Runs every 4 hours with existing tracking sync cron — no new cron job needed
  - Manual SQL cleanup of 9 test orders for mooreitemsshop@gmail.com
- **Admin orders page improvements:**
  - Default tab changed from 'all' to 'paid'
  - Tabs reordered: Paid, Processing, Shipped, Delivered, All Orders, Pending, Unfulfilled
  - Added delivered count to summary interface and API response
  - Sync tracking toast shows stale cleanup count
- **Shipping language update:**
  - Changed "Ships in 2-5 days" → "Delivered in 2-5 days" across entire codebase
  - Updated: product cards, product detail pages, cart, shipping policy references
- **Review count randomization:**
  - All products were showing 34 reviews (artifact of bulk polish script)
  - SQL update randomized counts by price tier: $100+ → 8-35, $30-99 → 4-20, <$30 → 1-12
- **Compare-at price adjustment:**
  - Reduced multiplier from 1.8-2.2x to 1.3-1.6x in `lib/config/pricing.ts`
  - Makes "was" prices more believable (30-60% off instead of 45-55% off)
- **Catalog curation (major cleanup):**
  - 14 supplement products hidden (liability risk): Butter Soft Capsules, Glucosamine, Glutathione, Hair/Skin/Nails, Immune supplements, Lion's Mane, Lutein, Magnesium, Raspberry Mushroom Gummies, Soft Capsule Vitamin, Taro Peptide Collagen, Vision Support, Vitamin D3, outdoor medicine bottle
  - 13 duplicate Chenille sectional sofas hidden (kept 3 unique styles)
  - 5 products with images too small for Google Shopping hidden (diaper bag, pantyhose, bracelet, ring, fishing lure)
  - 6 product names cleaned of promotional text: "New Product Car HUD" → "Car HUD HD Head-up Display", "Top Sale Natural Therapeutic" → "Natural Therapeutic Grade Aromatherapy", etc.
  - 2 misc junk products hidden
- **Digital product urgency fix:**
  - Removed fake "Only X left" badges from digital products (unlimited downloads shouldn't show scarcity)
- **Homepage social proof section:**
  - Added between Best Sellers and value props
  - 4-column layout (2×2 on mobile): "3,000+ Curated Products", "39,000+ 5-Star Reviews", "2-5 Days Fast US Delivery", "100% Secure Checkout"
  - Lucide icons (Package, Star, Truck, ShieldCheck) in gold (#c8a45e)
  - Cream background (#f7f6f3), Playfair Display numbers, DM Sans subtitles
- **Google Merchant Center setup completed:**
  - Delivery times: 1-2 days handling + 1-3 days transit = 2-5 business days, Eastern TZ, 2PM cutoff
  - Shipping: Flat rate $4.99, free over $50.00
  - Returns: 30-day window, accept defective and non-defective, by mail, customer pays return shipping, 7-day refund processing
  - Return policy URL: https://www.mooreitems.com/returns
  - ~2,840 products under review (should approve now that setup complete)
  - 322 "image not processed" (auto-resolves in 3 days)
  - 6 "additional text found" (fixed via SQL name cleanup)
  - 5 "image too small" (hidden)
- **Kids Printable Activity Bundle verified:**
  - Digital product confirmed active and ready to sell ($4.99, proper images, description, category)

**Key files modified in Session 16:**
- `app/api/admin/orders/sync-tracking/route.ts` — Added stale pending order cleanup (>48hr), returns cleanup count (UPDATED)
- `app/admin/orders/page.tsx` — Default tab 'paid', tab reorder, Delivered tab added (UPDATED)
- `app/api/admin/dashboard/route.ts` — Added delivered count to summary (UPDATED)
- `app/page.tsx` — Added social proof stats section (UPDATED)
- `lib/config/pricing.ts` — compareAtPriceMin 1.8→1.3, compareAtPriceMax 2.2→1.6 (UPDATED)
- Product cards / product detail — "Ships in" → "Delivered in" (UPDATED)

### Session 17 (Mar 1): Variant Data Quality & Selection System Overhaul
- **Critical UX bug identified:**
  - Customers could select invalid color+size combos (e.g., White + 40 Inches on Computer Desk where only Black 40" exists)
  - No validation prevented ordering non-existent variants → wrong products shipped → refunds, chargebacks
  - Root cause: VariantSelector showed all colors and all sizes independently with no cross-referencing
- **3-phase variant data repair (Phases 1-3):**
  - **Phase 1:** Backfill script for variants with null color/size but parseable names — initial pass
  - **Phase 2:** SQL pattern batches targeting common patterns (slash-separated "Color / Size", color-only, size-only, numeric sizes)
  - **Phase 3:** Automated prefix stripping (product name prefix removal from variant names) + final manual fixes for edge cases
  - Result: 444 broken multi-variant products fixed, 3,773→0 broken variants
  - Variant data quality: 95.1% of 28,104 variants now have color or size data (up from ~50% in Session 11)
- **Variant availability matrix system (3 new files):**
  - `lib/utils/variant-availability.ts` — core utility:
    - `buildAvailabilityMatrix()`: Creates cross-reference maps (validCombos Set, sizesByColor Map, colorsBySize Map, comboToVariantId, comboToImage, colorToImage)
    - `isComboValid()`: O(1) lookup for any color+size combo
    - `getVariantIdForCombo()`: Returns variant ID for exact combo
    - `getBestImage()`: Image fallback chain (exact combo → same color → first available)
    - `getAvailableSizes/Colors()`: Returns valid options based on current selection
    - `getBestSizeForColor/ColorForSize()`: Auto-adjusts to maintain valid combo
  - `hooks/useVariantSelection.ts` — state management hook:
    - Builds matrix from variants array (memoized)
    - Tracks selectedColor, selectedSize state
    - Computes selectedVariant, isValidCombo, canAddToCart
    - variantImageUrl with color-based fallback
    - handleColorChange/SizeChange callbacks with auto-adjustment
    - hasInitialized ref prevents image hijacking on page load
  - `components/product/VariantSelector.tsx` — REWRITTEN:
    - Accepts AvailabilityMatrix prop instead of computing internally
    - Greys out unavailable colors when size selected (and vice versa)
    - Strikethrough + 30% opacity for disabled options
    - Tooltip shows "not available in [size/color]"
    - Preserves gold highlight (#c8a45e) and smart size sorting
- **Integration into ProductPageClient.tsx:**
  - Replaced all existing variant state (useState, useMemo, useEffect for variants)
  - Hook provides everything: matrix, selections, matched variant, image, canAddToCart
  - Add-to-cart button disabled unless valid combo selected
  - Shows "Select valid options" text when product has selectors but no valid combo
- **QuickViewModal.tsx cascading fix:**
  - Claude Code automatically detected and updated QuickViewModal to use same new API
- **Verified on live site:**
  - Computer Desk product: Oak correctly greys out 40"/55"/63", White greys out all except 30"
  - Black/Rustic show all sizes available (correct — they have all 5 sizes)
- **Identified missing feature:**
  - No daily CJ stock sync — all stock hardcoded to 100
  - Checkout validation is safety net but customers shouldn't see unfulfillable products
  - Spec needed for next session

**Key files created/modified in Session 17:**
- `lib/utils/variant-availability.ts` — Variant availability matrix utility (NEW)
- `hooks/useVariantSelection.ts` — Variant selection state hook (NEW)
- `components/product/VariantSelector.tsx` — Rewritten with availability matrix integration (REWRITTEN)
- `app/product/[slug]/ProductPageClient.tsx` — Integrated useVariantSelection hook, removed old variant state (UPDATED)
- `components/storefront/QuickViewModal.tsx` — Same integration pattern as ProductPageClient (UPDATED)
- `lib/utils/variant-availability.ts` — Minor TS compat fix for Map iteration (UPDATED)

### Session 18 (Mar 1): CJ Webhook Real-Time Stock Sync
- **CJ stock sync strategy decision:**
  - Polling approach abandoned — CJ API limit of 1,000 calls/day insufficient for ~28,000 variants
  - Webhook approach chosen — real-time push notifications at zero API cost
- **Webhook registration:**
  - Built `scripts/register-cj-webhooks.js` — one-time registration script
  - Registered three webhook types: STOCK, PRODUCT, LOGISTICS → `https://mooreitems.com/api/webhooks/cj`
  - CJ auth rate limit (1 req/300s) required 5-minute cooldown between attempts
  - Endpoint fix: corrected from `/information/webhook/set` to `/webhook/set` per CJ API v2 spec
- **Webhook receiver built (`app/api/webhooks/cj/route.ts`):**
  - Handles STOCK events: VID-keyed objects with warehouse arrays, filters for US warehouse only
  - Handles VARIANT events: flat params object with vid, pid, variantStatus, variantSellPrice, etc.
  - Handles empty STOCK arrays: `{VID: []}` → zeros out variant stock, cascades to product out_of_stock
  - Flexible payload parsing for three CJ payload shapes (flat array, VID-keyed arrays, VID-keyed singles)
- **Payload format discovery:**
  - CJ's actual payloads differ significantly from documentation
  - VARIANT events send flat object (not nested arrays as docs suggest)
  - STOCK events use VID as object key (not in standardized wrapper)
  - Empty arrays are common for stock depletion across all warehouses
- **Serverless compatibility fix (critical):**
  - Initial handler sent 200 immediately, attempted DB work in background
  - Netlify terminates serverless functions after response → background work never executed
  - Fix: moved ALL processing (DB lookups + updates) before response
  - Supabase queries <100ms, well within CJ's 3-second timeout
- **End-to-end verification:**
  - Test with real `cj_vid` (1460857153295355904) → matched PHOERA Eyebrow Pencil → 266ms processing
  - Confirmed: CJ sends → Netlify receives → parses → matches cj_vid → updates variant → responds 200
- **Logging noise reduction:**
  - Raw body only logged when `CJ_WEBHOOK_DEBUG=true` env var set
  - Non-matching VIDs (majority of events) silently dropped
  - Only logs when actual match and update occurs
  - Errors always logged regardless of debug mode
- **CJ webhook event patterns observed:**
  - CJ sends events for entire catalog (thousands of products), not just store's ~3,000
  - Most STOCK events are China Warehouse (handler correctly filters for US only)
  - VARIANT events fire frequently for product detail changes
  - Empty arrays common for complete stock depletion
- **Three-layer inventory protection now complete:**
  1. CJ Webhooks (primary) — real-time STOCK/VARIANT updates, zero API calls consumed
  2. Checkout validation (safety net) — blocks delisted products at payment
  3. Health monitor (daily audit) — catches drift, auto-fixes safe issues

**Key files created/modified in Session 18:**
- `app/api/webhooks/cj/route.ts` — CJ webhook receiver with STOCK/VARIANT handlers, empty array handling, quiet logging (NEW)
- `scripts/register-cj-webhooks.js` — One-time webhook registration script (NEW)

**Commits in Session 18:**
- `91f7b16` — feat: add CJ webhook receiver and registration script
- `f0dbad5` — fix: correct CJ webhook endpoint path
- `3162b4f` — fix: robust CJ webhook params parsing and debug logging
- `9cf4425` — fix: process CJ webhook events before response (serverless compat)
- `5ca951e` — feat: handle empty stock arrays, reduce webhook logging noise

### Session 19 (Mar 1): Comprehensive AI Catalog Cleanup
- **Root cause identified:**
  - Original keyword-based categorization scripts (`recategorize-all.js`) had fundamental flaws
  - "Crystal" → Jewelry caught car wax and crystal tables
  - "USB" → Electronics caught bed frames with USB ports
  - "Ring" → Jewelry caught office chair foot rings
  - "Silver" → Jewelry caught exhaust manifolds
  - AI categorization script (`ai-categorize-remaining.js`) only ran on uncategorized products, not already-miscategorized ones
- **Manual discovery phase:**
  - Found exhaust manifold, sofas, car wax in Jewelry category while browsing
  - Manual SQL fixes: 4 hidden, 2 moved to Home & Furniture, 1 moved to Fashion
  - Database sweep found auto parts, furniture in wrong categories across all 13 categories
- **UI bugs fixed:**
  - Skeleton loading grid used `lg:grid-cols-4` while ProductGrid uses `lg:grid-cols-3` — fixed mismatch
  - Infinite scroll error handling: page 2+ fetch errors didn't reset `hasMore` flag → infinite retry loops — added `setHasMore(false)` in error branch
  - Both fixes in `app/category/[slug]/CategoryPageClient.tsx`
- **AI category audit — Pass 1 ($0.56):**
  - Built `scripts/ai-category-audit.js` — sends all ~2,900 products to Claude Haiku in batches of 50
  - Results: 728 recommended moves, 133 recommended hides, 22 duplicate hides, 1 parse error
  - Applied hides + duplicates only (154 products) — moves too aggressive without review
- **Filtered moves — Pass 2:**
  - Built `scripts/filter-moves.js` — strict keyword rules for high-confidence moves only
  - Filtered 728 → 100 moves (89 furniture, 9 kitchen, 2 beauty)
  - Applied all 100 moves
- **Comprehensive audit — Pass 3 ($0.42):**
  - Built `scripts/full-product-audit.js` — checks categories, duplicates, junk, bad names, missing data
  - 572 category mismatches, 1 duplicate group, 13 junk items, 6 bad names, 873 missing data items
  - Hidden 13 junk items, renamed "Pet House" → "Solid Wood Outdoor Pet House with Waterproof Asphalt Roof"
- **Category grouping — Pass 4 ($0.41):**
  - Built `scripts/category-audit.js` — category-only audit with group-by pattern analysis
  - 561 mismatches grouped by source→target patterns
  - Applied 12 high-confidence groups with keyword filtering: 117 products moved
  - Top moves: 23 kitchen→garden (BBQ/gazebos), 19 pet→fashion (human clothing), 13 jewelry→fashion (t-shirts), 11 fashion→storage (shoe racks)
- **Hidden product rescue ($0.18):**
  - Audited all 369 hidden products via Claude Haiku
  - 161 confirmed junk (stay hidden), 172 legitimate products (reactivate), 25 duplicates, 11 unclear
  - Excluded supplements from reactivation (liability decision from Session 16)
  - 92 already had clean names → reactivated as-is
  - 23 auto-cleaned via regex (stripped "Prohibited Platform Temu", "WalMart Banned", etc.)
  - 57 AI-renamed via Haiku ("Bracelet" → "Freshwater Pearl Beaded Bracelet", "Tummy Machine" → "Abdominal Core Training Exercise Machine")
  - All 172 moved to correct categories and set to active with stock_count = 100
- **Category counts refreshed** — accurate numbers across all 13 categories
- **Final catalog state:**
  - ~2,900 active products (down from ~2,985 due to net junk removal, up from where it would've been without rescues)
  - ~380 hidden products (confirmed junk, supplements, duplicates, industrial)
  - Category accuracy significantly improved — keyword false positives eliminated
  - Total AI cost for entire session: ~$1.60

**Key files created/modified in Session 19:**
- `scripts/ai-category-audit.js` — AI category audit with hide/move/duplicate detection (NEW)
- `scripts/filter-moves.js` — High-confidence move filter with keyword rules (NEW)
- `scripts/full-product-audit.js` — Comprehensive product quality audit (NEW)
- `scripts/category-audit.js` — Category-only audit with group-by analysis (NEW)
- `app/category/[slug]/CategoryPageClient.tsx` — Fixed skeleton grid cols (4→3), added hasMore error reset (UPDATED)

### Session 20 (Mar 3): China Warehouse Expansion
- **Full code + database audit:**
  - Queried all 6 key Supabase tables (mi_products, mi_product_variants, mi_orders, mi_order_items, warehouse distribution, shipping estimates)
  - Audited 17 code files: pricing, shipping, CJ client, fulfillment, checkout, webhooks, import scripts, product card, product page, cart, Google Merchant feed, types, health monitor, AI assistant, email templates
  - Discovered system was already ~80% CN-ready: `warehouse` column defaults to 'CN', types already support 'US' | 'CN' | 'CA', checkout already branches delivery estimates, product page already had CN messaging
  - Reduced scope from 8 phases / 7-9 sessions to 10 steps / 1 session
- **Database cleanup:**
  - 159 stale "3-7 business days" shipping estimates → "2-5 business days"
  - 3,204 stale `shipping_days` values cleaned ("3-7 days" → "2-5 days")
  - Added `warehouse` TEXT column to `mi_order_items`
- **Pricing config (lib/config/pricing.ts):**
  - Added `CN_PRICING_CONFIG` — 2.2x markup, 45% min margin, $5 shipping estimate
  - Added `getPricingConfig(warehouse)` helper function
  - `lib/pricing.ts` unchanged (already accepts shippingCost as parameter)
- **CJ fulfillment routing (lib/cj/fulfill-order.ts):**
  - Added product warehouse lookup via `warehouseMap`
  - `fromCountryCode`: CN for CN-only orders, US for US/mixed
  - `logisticName`: CJPacket Ordinary for CN, USPS+ for US
  - `wareHouseCountryCode`: per-product routing from actual warehouse data
  - Mixed orders: each product specifies its own warehouse
- **Webhook handler (app/api/webhooks/cj/route.ts):**
  - `stockByVid` now tracks `{ us: number; cn: number }` per VID
  - `addStock()` helper routes stock to correct country bucket
  - Product warehouse lookup determines which stock number to use
  - US products use US stock, CN products use CN stock
- **Product card (components/storefront/ProductCard.tsx):**
  - US: green Truck icon, "Delivered in 2-5 days" (unchanged)
  - CN: amber Globe icon, "Delivered in 7-15 days" (new)
- **Cart (app/cart/page.tsx):**
  - Detects warehouse mix: hasUSItems, hasCNItems
  - US-only: "All items ship from US warehouses — estimated delivery in 2-5 business days"
  - CN-only: "Items ship internationally — estimated delivery in 7-15 business days"
  - Mixed: "US items: 2-5 business days - International items: 7-15 business days"
  - Digital combos handled correctly
- **Checkout (app/api/checkout/route.ts):**
  - Added `warehouse: item.warehouse` to order items insert
  - Already had CN delivery estimates (10-18 days) — no other changes needed
- **Google Merchant feed (app/api/feeds/google-merchant/route.ts):**
  - CN products: "International Standard" service, $6.99, 7-15 day transit, 2-5 day handling
  - US products: unchanged
- **CN import pipeline:**
  - Created `scripts/import-cn-products.js` — no countryCode filter, CN pricing/shipping/margins
  - Imported page 1: 90 products saved, 10 skipped
  - AI categorized: 74 categorized across 9 categories, 16 hidden as junk
  - 3 delisted products marked out_of_stock
  - All 71 active CN products enriched: images, AI-polished names + descriptions, reviews
- **Sitewide messaging updates:**
  - Ticker: redesigned with 4 new messages (secure checkout, fast delivery, free shipping, reviews)
  - About page: "2-5 day US warehouse delivery, plus international shipping options"
  - Shipping policy: "Orders ship from US warehouses (2-5 business days) or international warehouses (7-15 business days)"
  - AI assistant: system prompt updated with dual-warehouse shipping info
  - All 12 category descriptions: removed "US warehouses" language, updated to warehouse-neutral
- **Bug fix:** "Ships fromChina" → "Ships from China" (missing space in ProductPageClient.tsx)

**Key files created/modified in Session 20:**
- `lib/config/pricing.ts` — Added CN_PRICING_CONFIG + getPricingConfig() (UPDATED)
- `lib/cj/fulfill-order.ts` — Warehouse-aware routing: warehouseMap, per-product wareHouseCountryCode (UPDATED)
- `app/api/webhooks/cj/route.ts` — Dual-country stock tracking: { us, cn } per VID (UPDATED)
- `components/storefront/ProductCard.tsx` — CN amber badge "Delivered in 7-15 days" (UPDATED)
- `app/cart/page.tsx` — Warehouse-aware shipping messaging (UPDATED)
- `app/api/checkout/route.ts` — Added warehouse to order items insert (UPDATED)
- `app/api/feeds/google-merchant/route.ts` — CN shipping rules in merchant feed (UPDATED)
- `scripts/import-cn-products.js` — CN warehouse import script (NEW)
- `components/storefront/AnnouncementBar.tsx` — New ticker messages (UPDATED)
- `app/about/page.tsx` — Dual-warehouse shipping language (UPDATED)
- `app/api/assistant/route.ts` — AI assistant warehouse awareness (UPDATED)
- `app/shipping-policy/page.tsx` — Dual-warehouse shipping policy (UPDATED)
- `app/product/[slug]/ProductPageClient.tsx` — "Ships from China" spacing fix (UPDATED)

**Commits in Session 20:**
- `992477c` — feat: China warehouse support — warehouse-aware fulfillment, webhooks, pricing, UI badges, cart messaging, merchant feed
- `0be63f0` — fix: update US-only messaging for CN warehouse support — ticker, about, assistant, shipping policy
- `1f89ee0` — fix: updated ticker messages — secure checkout, fast delivery, free shipping, reviews
- `72ee840` — fix: spacing in Ships from China on product page

---

*This document serves as the single source of truth for the MooreItems.com project. Upload it to the Claude Project and use it to provide context at the start of any new Claude conversation about this project.*
### Session 22 (Mar 5): Product Scout Fixes, Price Sync & Catalog Cleanup

**Product Scout debugging & fixes:**
- Root cause of "Unexpected token '<'" error: CJ auth endpoint hitting QPS rate limit (1/300s), returning HTML error page instead of JSON
- Added content-type guard before `response.json()` in `lib/cj/client.ts` — all CJ API calls now check content-type before parsing
- Added `safeJson()` helper in product-scout page to surface actual HTML content in error messages instead of cryptic parse errors
- Fixed CJ token caching: module-level variable resets on Netlify cold starts — moved to two-layer cache:
  - L1: in-memory (warm instances, zero I/O)
  - L2: Supabase `mi_settings` table (persists across cold starts, survives function restarts)
  - Token cached for 23 hours; graceful fallback if within 300s cooldown but token still valid
- Fixed 504 timeout: removed per-product `enrichProduct()` calls from bulk keyword search — enrichment now only runs on direct PID lookup, bringing response time from ~20s to ~2s
- `requireAdmin()` moved inside try/catch on all 4 scout routes to prevent unhandled throws returning HTML 500

**Product price not updating on storefront:**
- Root cause: `mi_product_variants.retail_price` not synced when product price edited in admin dashboard
- `effectivePrice = selectedVariant?.price || product.price` — stale variant price always won over updated product price
- Fixed PATCH handler in `app/api/admin/products/route.ts` to sync `retail_price` to all variants on price update
- Fixed `app/api/admin/reprice/route.ts` (bulk reprice) to sync variant prices too
- Added `revalidatePath()` to 4 admin routes: product edit, delete, scout import, bulk reprice
- Added `export const dynamic = 'force-dynamic'` to `app/product/[slug]/page.tsx` (duplicate of existing line 64 removed, causing build failure)
- Confirmed Netlify not caching (Cache-Status: fwd=bypass) — issue was purely stale variant data, not CDN

**Admin dashboard improvements:**
- Stats bar added to products page: Active / Hidden / Out of Stock counts (2,476 / 213 / 609)
- Column sorting fixed — now server-side via orderBy params passed to Supabase query (was client-side on current page only)
- PATCH response now re-fetches product with mi_categories join before returning — fixes temporary "Uncategorized" flicker after price edit
- Customers page: real paying customers (have at least one paid order) separated from leads (abandoned cart / email subscribers only) with separate Leads tab

**Catalog cleanup:**
- 107 uncategorized active products identified via new stats bar
- Mar 4 Scout imports had garbled Chinese product names — both AI and keyword categorization failed on import
- Ran `scripts/ai-categorize-remaining.js --dry-run` then `--apply`: 53 categorized, 1 hidden (Fragrant Painting Roller flagged as junk), 0 failures
- Refreshed all `mi_categories.product_count` values via inline Node script
- `mi_settings` table created in Supabase for persistent key-value storage (used for CJ token cache)

**Key files modified in Session 22:**
- `lib/cj/client.ts` — content-type guard on all response.json() calls, two-layer token cache (L1 memory + L2 Supabase mi_settings)
- `app/admin/product-scout/page.tsx` — safeJson() helper, replaced all 7 res.json() calls
- `app/api/admin/scout/search/route.ts` — removed enrichProduct() from bulk search, requireAdmin() inside try/catch
- `app/api/admin/scout/import/route.ts` — requireAdmin() inside try/catch, revalidatePath on import
- `app/api/admin/scout/watchlist/route.ts` — requireAdmin() inside try/catch
- `app/api/admin/scout/catalog-search/route.ts` — requireAdmin() inside try/catch
- `app/api/admin/products/route.ts` — variant price sync on PATCH, re-fetch with category join in response, revalidatePath
- `app/api/admin/reprice/route.ts` — variant price sync on bulk reprice, revalidatePath
- `app/product/[slug]/page.tsx` — removed duplicate force-dynamic export (build fix)
- `app/admin/products/page.tsx` — stats bar (Active/Hidden/Out of Stock), server-side column sorting
- `app/api/admin/customers/route.ts` — filter to paying customers only, Leads tab for non-ordering contacts

**Commits in Session 22:**
- `f2370e9` — fix: CJ token caching (L1 memory + L2 Supabase) + scout JSON error handling
- `488128d` — fix: force-dynamic on product pages to fix stale price cache
- `1592ba8` — fix: remove duplicate force-dynamic export in product page (build fix)
- Various — fix: sync variant retail_price when product price updated, revalidatePath, category join in PATCH response, admin stats bar, server-side sorting, customer/leads separation

**Admin products page — additional improvements (later in Session 22):**
- Removed "Re-sync All" button entirely — it deleted all 3,298 products and only restored 200, a catalog-nuking landmine from early dev
- Removed "Sync CJ" button entirely — blind import of 200 random products with keyword-only categorization; replaced by Product Scout and import scripts
- Deleted `app/api/admin/sync/route.ts` and `app/api/admin/resync/route.ts`
- Added warehouse count display below filter bar: "Showing 2,476 products · US: 1,843 · CN: 633" — updates dynamically with filters
- Added "Out of Stock" option to status filter dropdown — previously the 609 out_of_stock products were unreachable from admin UI
- `GET /api/admin/products` now returns `warehouse_counts: { US, CN }` via parallel count queries using extracted `applyFilters()` helper

**Image enrichment (Session 22):**
- Audited single-image products: 723 active products had only 1 image stored, but CJ had 7-14 images available
- Root cause: original bulk sync only grabbed the list API thumbnail, skipped `productImageSet` from detail API
- Created `scripts/fetch-missing-images.js` — images-only enrichment, both warehouses, dry-run support, 900-call safety limit
- Ran in 2 batches (452 total CJ API calls): 408 products updated from 1 → 5-27 images, 37 genuinely have 1 image on CJ, 7 discontinued
- 7 discontinued products ("Product has been removed from shelves") set to `out_of_stock`
- Remaining single-image count: 37 (genuinely limited by CJ's catalog)

**Key additional files modified:**
- `scripts/fetch-missing-images.js` — NEW: image-only enrichment script for single-image products
- `app/admin/products/page.tsx` — removed Sync CJ + Re-sync All buttons, added warehouse count bar, Out of Stock filter
- `app/api/admin/products/route.ts` — applyFilters() helper, warehouse_counts in response
- `app/api/admin/sync/route.ts` — DELETED
- `app/api/admin/resync/route.ts` — DELETED

**Additional commits:**
- `feat: warehouse count display + out of stock filter in admin products`
- `feat: fetch-missing-images script, remove Sync CJ and Re-sync All buttons, hide 7 discontinued products`

### Session 23 (Mar 6): Per-Variant Stock Accuracy & Fully Autonomous Inventory System

**Root cause discovered:**
- CJ's `getInventoryByPid` endpoint returns TWO inventory structures:
  - `inventories` — product-level warehouse totals (what all previous code was reading)
  - `variantInventories` — array of `{ vid, inventory: [{ countryCode, totalInventory }] }` — **this was being ignored**
- All stock logic was spreading the product-level US total equally across every variant — completely wrong
- Verified on jacket product: DB showed stock=4 on all 45 variants; real CJ stock was White/L=2, Blue/XL=1, all others=0

**Fixes across every layer:**

- **`scripts/check-product-stock.js`** — updated to read `variantInventories` for per-variant CJ stock. Comparison table now shows accurate per-VID US/CN stock columns instead of product total spread across all rows.

- **`app/api/admin/catalog/stock-sync/route.ts`** — replaced `getTotalStock()` with two helpers:
  - `getProductTotalStock()` — product-level total for hide/reactivate decisions (Case 1 unchanged)
  - `buildVariantStockMap()` — parses `variantInventories` into `Map<vid, {us, cn}>`
  - Cases 2 and 3 now fetch all active variants with `cj_vid`, look up each in the map, and update individually
  - Zero stock (`cjStock === 0`) always writes regardless of `STOCK_CHANGE_THRESHOLD` — a variant going to zero is always significant
  - Threshold (`>= 5`) still applies for non-zero changes to prevent noise

- **`app/api/admin/catalog/health-check/route.ts`** — removed the CHECK 1 auto-fix that was resetting zero-stock active variants back to `stock_count = 100`. This was actively fighting the webhook system (webhooks correctly zero depleted variants → health check reset them to 100). Now reports zero-stock variants as informational (severity changed from HIGH to MEDIUM).

- **`app/api/webhooks/cj/route.ts`** — two fixes:
  - Fixed `const productIds` double-declaration bug in `handleStockUpdate()`
  - Added `handleProductUpdate()` function: `productStatus: 0` → find product by `cj_pid`, set `out_of_stock`, update category count; `productStatus: 1` → ignored (daily sync handles reactivation after verifying stock); no DB match → skip silently

- **`scripts/register-cj-webhooks.js`** — added `variant` webhook type to registration payload alongside stock/product/logistics. All four types re-registered successfully.

- **`lib/utils/variant-availability.ts`** — `getAvailableColors()` now always returns `matrix.allColors` (built from active, in-stock variants only) regardless of selected size. A color now only greys out if it has zero stock across ALL sizes, not just the currently selected size.

- **`components/product/VariantSelector.tsx`** — tooltip text updated from "not available in {size}" to "out of stock" since colors are no longer filtered by size.

- **`scripts/test-stock-sync.js`** — new targeted one-off script to test per-variant sync against a single product without burning API calls on full catalog. Used to verify jacket product fix.

**Verification results (jacket product):**
- 43 variants: DB stock 4 → 0 (no US stock)
- Blue/XL: 4 → 1
- White/L: 4 → 2
- Only 3 units total US stock — previously DB was showing 4 on every variant

**Cron jobs (all three now running):**
- 3:00 AM — MooreItems Catalog Health Check
- 4:00 AM — MooreItems Stock Sync (NEW — Session 23, `STOCK_SYNC_SECRET` auth, POST)
- Every 4 hours — MooreItems Tracking Sync

**Autonomous inventory coverage (complete):**
- ✅ Stock goes up → variants update (webhook real-time + daily sync backup)
- ✅ Stock goes down → variants update (webhook real-time + daily sync backup)
- ✅ Variant goes to zero → always written (zero bypass on threshold)
- ✅ Product runs out → hidden from storefront automatically
- ✅ Product restocked → reappears automatically
- ✅ Variant delisted by CJ → deactivated automatically
- ✅ Variant reactivated → restored automatically
- ✅ Product discontinued by CJ → hidden automatically (PRODUCT webhook — NEW)
- ✅ Health check reports without fighting other layers (auto-fix removed)
- ✅ SendGrid email alerts on any sync changes
- ✅ US products use US stock, CN products use CN stock (warehouse-aware)

**Key files created/modified in Session 23:**
- `scripts/check-product-stock.js` — reads `variantInventories` for per-variant stock (UPDATED)
- `scripts/test-stock-sync.js` — targeted single-product sync test script (NEW)
- `app/api/admin/catalog/stock-sync/route.ts` — `buildVariantStockMap`, per-variant updates, zero bypass (UPDATED)
- `app/api/admin/catalog/health-check/route.ts` — removed zero-stock auto-fix (UPDATED)
- `app/api/webhooks/cj/route.ts` — fixed productIds bug, added PRODUCT webhook handler (UPDATED)
- `scripts/register-cj-webhooks.js` — added variant webhook type (UPDATED)
- `lib/utils/variant-availability.ts` — color greying uses all-colors not size-filtered (UPDATED)
- `components/product/VariantSelector.tsx` — tooltip text fix (UPDATED)

**Commits in Session 23:**
- `fix: color greying only when truly out of stock`
- `feat: handle CJ PRODUCT webhook for discontinued products`

### Session 24 (Mar 6): Category-Aware Pricing Engine & Admin UI Rebuild

**Root cause audit findings:**
- Pricing config hardcoded in TypeScript — admin UI adjustments were ephemeral, lost on page refresh
- CN_PRICING_CONFIG existed in code but was dead — reprice route never called it; all CN products priced with US settings
- No per-category pricing — `mi_categories` had zero pricing columns
- Minimum margin was 40% — too high, causing many cheap products to be skipped entirely

**Phase 1 — DB Foundation:**
- Seeded `pricing_config` into `mi_settings` (us_markup: 1.6, cn_markup: 1.8, us_min_margin: 0.15, cn_min_margin: 0.20, us/cn shipping estimates, stripe fees, compare-at range, round_to_99)
- Created `mi_category_pricing` table with 12 rows: category_slug (UNIQUE), category_name, min_price, target_margin, markup_override, is_active
- Verified all 12 category slugs match `mi_categories.slug` exactly (100% match rate)

**Phase 2 — Engine Fixes (`lib/config/pricing.ts` + `app/api/admin/reprice/route.ts`):**
- Added `getPricingConfigFromDB(supabase, warehouse)` — reads mi_settings, maps flat keys to PRICING_CONFIG shape, warehouse-aware, falls back to hardcoded on failure
- Added `getCategoryPricingRules(supabase)` — reads mi_category_pricing, returns slug-keyed lookup
- Reprice route updated: builds `categoryIdToSlug` UUID map from mi_categories, loads warehouse-specific config per product, applies category markup_override and target_margin, enforces min_price floor after calculatePricingWithConfig() with margin recalculation. isViable check moved after floor enforcement.
- CN warehouse bug fixed: CN products now get 1.8x markup and $5 shipping estimate instead of US values

**Phase 3 — Admin UI Rebuild (`app/admin/pricing/page.tsx`):**
- Full replacement of existing page
- Section 1 — Global Settings: US/CN side-by-side cards, plain-English labels with helper text, Compare-At Range, Round to .99 toggle. Saves to /api/admin/pricing-config. Loads from DB on mount.
- Section 2 — Category Minimum Prices: 12-row table, editable Min Price/Target Margin/Markup Override. Saves to /api/admin/category-pricing.
- Section 3 — Preview & Reprice: client-side live preview using form state, confirmation dialog, spinner, success count. POSTs to /api/admin/reprice with mapped config.
- Two new API routes: `app/api/admin/pricing-config/route.ts` (GET/POST mi_settings), `app/api/admin/category-pricing/route.ts` (GET/POST mi_category_pricing)

**Reprice results:**
- 2,621 products repriced, 1 skipped
- Second pass: 2,616 products repriced (3 floor stragglers fixed manually via SQL)
- Final verification: zero products below category floor across entire catalog
- Average margin: ~39.9% (lower than old 47%+ due to 1.6x vs 2.0x)
- Jewelry min price: $9.99 (previously some items at $6.99)

**Key files created/modified in Session 24:**
- `lib/config/pricing.ts` — added `getPricingConfigFromDB()` + `getCategoryPricingRules()` (UPDATED)
- `app/api/admin/reprice/route.ts` — warehouse-aware config, categoryIdToSlug map, category rules, min price floors (UPDATED)
- `app/api/admin/pricing-config/route.ts` — GET/POST global config (NEW)
- `app/api/admin/category-pricing/route.ts` — GET/POST category rules (NEW)
- `app/admin/pricing/page.tsx` — full rebuild, 3 sections (REPLACED)
- `supabase/migrations/20260306_category_pricing.sql` — mi_category_pricing table + seed data (NEW)

**Commit in Session 24:**
- `cd8fa7b` — feat: category-aware pricing engine with persistent config and admin UI rebuild

### Session 25 (Mar 6): Daily Auto-Import Pipeline

**Goal:** Automate daily product discovery — surface 10 new CJ products every morning, AI-vet them, email a digest, and let Danny approve/reject before anything goes live.

**Architecture decision:** Cron-triggered suggest → human review → approve workflow. Products are NEVER added to the store automatically — only after explicit admin approval.

**Database:**
- Created `mi_auto_import_suggestions` table — `batch_id`, `cj_pid`, `product_name`, `product_image`, `cj_category`, `cj_price`, `shipping_cost`, `retail_price`, `margin_percent`, `warehouse`, `us_stock`, `variant_count`, `ai_score` (0-100), `ai_reasoning`, `ai_season_ok`, `ai_brand_fit`, `ai_quality_ok`, `status` (pending/approved/rejected/imported/error), `imported_product_id`, `error_message`
- Unique index on `cj_pid` WHERE `status = 'pending'` — prevents duplicate pending entries

**New files (9):**
- `supabase/migrations/20260306_auto_import_suggestions.sql` — table + indexes
- `lib/ai/product-enrichment.ts` — standalone `categorizeWithAI()`, `generateReviewsForProduct()`, `stripHtml()` (copied from scout/import, scout untouched)
- `lib/email/templates/auto-import-digest.ts` — MooreItems-branded email with product cards, AI scores, pricing, CTA to admin
- `app/api/auto-import/suggest/route.ts` — dual auth (cron secret OR admin session), fetches 30 CJ products (pages 31-80, skips pages 1-30 already in catalog), deduplicates against mi_products + pending suggestions, filters heavy furniture + $150 price cap, AI scores via Claude Haiku in single batch, saves top 10, sends digest email
- `app/api/auto-import/route.ts` — GET list with ?status= filter grouped by batch
- `app/api/auto-import/approve/route.ts` — single product per request (avoids 504), full enrichment: CJ detail + stock + freight + AI categorization + AI name/description rewrite + pricing via DB config + variants + reviews + category count update + cache bust
- `app/api/auto-import/reject/route.ts` — bulk reject by suggestion IDs
- `app/admin/auto-import/page.tsx` — batch grouping, product cards (image, pricing, AI score badge, season/brand/quality pills, reasoning), sequential approve with "Importing product X of Y..." progress, per-card status updates
- `netlify/functions/auto-import-suggest.mts` — Netlify scheduled function, 2 AM daily (cron: `0 2 * * *`), calls suggest route with AUTO_IMPORT_SECRET

**Modified files (2):**
- `lib/email/sendgrid.ts` — added `AutoImportDigestData` interface + `sendAutoImportDigest()`
- `components/admin/Sidebar.tsx` — added Sparkles icon + "Auto Import" nav item in TOOLS section

**Bugs discovered and fixed during build:**
1. **CJ V2 response shape** — `/product/listV2` returns `data.content[0].productList[]` not `list[]`. Fixed with content block flatMap extraction.
2. **CJ V2 field names** — V2 uses `id` (not `pid`), `nowPrice` (not `sellPrice`, often a range string "3.50-5.00"), `nameEn` (not `productNameEn`). Fixed with `v2Pid()`, `v2Price()`, `v2Name()` helpers that parse correctly.
3. **Page range** — pages 1-30 are already in catalog. Changed to `random(31-80)`.
4. **Pricing in suggest** — was using hardcoded 2.0x `calculatePricing()`. Fixed to use `calculatePricingWithConfig()` + `getPricingConfigFromDB()` for correct 1.6x markup.
5. **Pricing in approve** — same hardcoded 2.0x bug. Fixed to use DB-configured markup.
6. **AI description quality** — raw CJ spec text ("Lighter and more Pu cross-border", "Housekeeping.") survived initial cleaning. Improved Haiku prompt with explicit exclusion list and lifestyle-focused copy instructions. `max_tokens: 600`.
7. **504 timeout on bulk approve** — processing multiple products in one request hit Netlify's function timeout. Fixed by processing one product per request; admin UI loops sequentially with progress indicator.
8. **Duplicate check blocked hidden products** — re-importing a previously hidden product failed. Fixed duplicate check to `WHERE cj_pid = $pid AND status != 'hidden'`.

**Furniture/heavy item exclusion:**
- Category blocklist: sofa, couch, sectional, mattress, bed frame, wardrobe, dresser, armoire, recliner, loveseat
- CJ price cap: $150 maximum (lightweight, shippable products only)

**AI scoring prompt key rules:**
- Score 0-100 on: season fit, brand fit ("Nordstrom meets Target"), margin quality, product quality signals
- Heavy gym equipment, niche educational toys, vague-category items score low
- Fashion, home accessories, pet supplies, kitchen items score high
- Haiku processes all candidates in single batch call for efficiency

**Cron schedule:**
- 2 AM daily via Netlify scheduled function (`auto-import-suggest`)
- `AUTO_IMPORT_SECRET=mooreimp2026` — set in both .env.local and Netlify

**New env var:**
```
AUTO_IMPORT_SECRET=mooreimp2026
```

**Key files created/modified in Session 25:**
- `supabase/migrations/20260306_auto_import_suggestions.sql` — NEW
- `lib/ai/product-enrichment.ts` — NEW
- `lib/email/templates/auto-import-digest.ts` — NEW
- `app/api/auto-import/suggest/route.ts` — NEW
- `app/api/auto-import/route.ts` — NEW
- `app/api/auto-import/approve/route.ts` — NEW
- `app/api/auto-import/reject/route.ts` — NEW
- `app/admin/auto-import/page.tsx` — NEW
- `netlify/functions/auto-import-suggest.mts` — NEW
- `lib/email/sendgrid.ts` — added sendAutoImportDigest() (UPDATED)
- `components/admin/Sidebar.tsx` — Auto Import nav item (UPDATED)

**Commits in Session 25:**
- `feat: daily auto-import pipeline with AI vetting, staging table, digest email, approve/reject admin UI`
- `fix: correct CJ V2 response shape in auto-import suggest route`
- `fix: auto-import suggest V2 field names (id/nowPrice/nameEn), page range 31-80`
- `fix: auto-import pricing uses 1.6x from DB, exclude heavy furniture, $150 price cap`
- `fix: improve AI description cleaning prompt, use DB pricing in approve route`
- `fix: allow re-import of hidden products in auto-import approve route`
- `fix: approve one product per request to avoid 504 timeout`

### Session 27 (Mar 7): Cookie Consent Banner & Admin Refund Workflow
- **Cookie consent banner:**
  - Created `components/CookieConsent.tsx` — fixed navy bottom bar, cream text, gold privacy policy link, Decline (ghost outline) + Accept All (solid gold) buttons
  - Mobile: stacks text above full-width buttons
  - Sets `localStorage.mi_cookie_consent = "accepted" | "declined"` on user action
  - Dispatches custom `mi:cookie-consent-accepted` window event on accept
  - Returns null on mount if consent already stored — no banner on returning visitors
  - Placed before `</body>` in `app/layout.tsx` (outside provider tree — no context needed)
- **Meta Pixel consent gating (MetaPixel.tsx updated):**
  - fbq stub `!function(f,b,e,...)` always renders (pure JS queue setup, zero network calls)
  - `fbevents.js` `<Script>` only mounts when `consentGiven === true`
  - `consentGiven` state initialized from localStorage on mount, updated via custom event listener
  - Queued `fbq('init')` and `fbq('track', 'PageView')` calls flush automatically when SDK loads
  - `<noscript>` pixel also gated behind consent (makes a network call to Facebook)
- **Admin refund workflow:**
  - SQL migration `supabase/migrations/add_refund_columns.sql` — adds `refund_status TEXT`, `refunded_at TIMESTAMPTZ`, `stripe_refund_id TEXT` to `mi_orders`; run in Supabase SQL editor
  - New `app/api/admin/orders/refund/route.ts` — POST handler with requireAdmin() guard; validates order is paid + not already refunded; fetches `stripe_payment_intent_id` from `mi_orders`; calls `stripe.refunds.create()`; updates DB with refund status/timestamp/ID; returns `{ success, refundId }`
  - Updated `app/admin/orders/page.tsx` — added `refund_status` to Order interface; red "Refund" button in expanded Stripe section for paid orders; inline confirmation dialog showing order total; loading spinner while processing; success shows green "Refunded" badge with amount + date; orders already refunded show read-only badge
  - Tested end-to-end: live $14.33 order refunded successfully, confirmed in Stripe dashboard
  - Key gotcha: local `.env.local` must use `sk_live_...` to refund live payment intents; `sk_test_...` returns "No such payment_intent" for live orders

**Key files created/modified in Session 27:**
- `components/CookieConsent.tsx` — Cookie consent banner (NEW)
- `components/MetaPixel.tsx` — Consent-gated pixel: stub always loads, fbevents.js gated (UPDATED)
- `app/layout.tsx` — Added `<CookieConsent />` before `</body>` (UPDATED)
- `supabase/migrations/add_refund_columns.sql` — Adds refund columns to mi_orders (NEW)
- `app/api/admin/orders/refund/route.ts` — Admin refund API (NEW)
- `app/admin/orders/page.tsx` — Refund button + confirmation + badge UI (UPDATED)

### Session 28 (Mar 7): Auto-Import Pipeline Activation & Fixes

**Context:** Session 25 built the full auto-import pipeline but files were never committed (untracked). Session 28 resolved all activation issues and got the first successful automated digest email delivered.

#### Root Cause: Files Were Untracked, Not Missing
- All auto-import files existed on disk but were never staged/committed to git
- `git status` showed them as untracked; `git pull` returned "Already up to date" — misleading Claude Code into thinking the routes didn't exist
- Resolution: `git add` of all auto-import files confirmed they were already built correctly; only the `x-auto-import-secret` header auth was missing

#### Netlify Scheduled Function Not Firing
- Scheduled function `auto-import-suggest.mts` registered with `0 2 * * *` (2 AM UTC = 9 PM EST) but never executed
- Netlify logs were empty even though the deploy happened before the scheduled window
- **Fix:** Added cron-job.org as the reliable trigger instead of relying on Netlify's scheduled function
- cron-job.org job: POST to `https://mooreitems.com/api/auto-import/suggest`, daily at 8:00 AM EST (America/New_York timezone), header `x-auto-import-secret: mooreimp2026`
- **Note:** `www.mooreitems.com` redirects 308 to `mooreitems.com` — cron-job.org does not follow redirects, must use non-www URL

#### x-auto-import-secret Header Auth Added
- Original suggest route only supported `?key=` query param (for Netlify function) and admin session
- Added third auth method: `x-auto-import-secret` request header for cron-job.org
- Triple auth now: query param OR header OR admin session
- Commit: `0d90191 feat: add x-auto-import-secret header auth for cron-job.org trigger`

#### Silent Email Failure Bug Fixed
- `sendEmail()` returns `{ success: false, error: '...' }` on failure — it never throws
- The original `.catch()` pattern only catches thrown errors, so failed email results were silently ignored
- Fix: check the returned `{ success }` value explicitly, log `[auto-import] Digest email failed: <reason>` on failure
- Commit: `35d29bd fix: digest email result was silently swallowed, add proper logging`

#### SendGrid From Address Fix
- `SENDGRID_FROM_EMAIL` in Netlify was set to `hello@mooreitems.com` — not verified in SendGrid
- `hello@mooreitems.com` mailbox doesn't exist so verification email could not be received
- **Fix:** Reverted `SENDGRID_FROM_EMAIL` to `mooreitemsshop@gmail.com` (already verified as Single Sender in SendGrid)
- Note: Domain authentication for `www.mooreitems.com` is verified in SendGrid but `hello@mooreitems.com` requires Single Sender verification separately — domain auth alone is insufficient for addresses without an active mailbox

#### Admin UI Improvements (auto-import/page.tsx)
- **Larger product images:** Increased from ~60px to 160×160px (`w-40 h-40`) with `object-cover` and `rounded-lg`
- **CJ PID display:** Shows `PID: {cj_pid}` below product name with clipboard icon; green checkmark confirmation on copy
- **View Product link:** For imported products only — fetches slug from `mi_products` via Supabase browser client, renders purple "View Product →" link with external icon
- **TypeScript fix:** `[...new Set(productIds)]` → `Array.from(new Set(productIds))` to avoid `--downlevelIteration` compile error
- Commits: `1fd421d`, `fix: use Array.from instead of spread for Set iteration`
- **CJ product page links are not viable** — CJ API-only products return "Product removed" on their public storefront. Use Product Scout (admin) with the PID for full details instead.

#### Email Template Improvements
- Container widened from 640px to 800px
- Products render in 2-column grid (pairs side by side) vs single-column stack
- Mobile breakpoint at 820px with `display:block` fallback for stacked columns on small screens
- Commit: `df3fb38`

#### First Successful End-to-End Run Confirmed
- cron-job.org Test Run → 200 OK, 12.17s, batch `auto-2026-03-07-mmgfaxgx`, 10 candidates
- Digest email received at mooreitemsshop@gmail.com (9:45 AM EST)
- 6 of 7 products successfully approved and imported to catalog; 1 error (504 timeout on hair curler — transient CJ API slowness, resolved on retry)
- 1 duplicate correctly blocked (Memory Foam Cushion already in catalog)
- Pipeline is fully operational — 8 AM EST daily digest going forward

#### Key Learnings
- **Netlify scheduled functions are unreliable for critical jobs** — use cron-job.org as the trigger for any production cron work; keep the `.mts` file as fallback but don't depend on it
- **cron-job.org requires exact non-www URL** — always verify redirect behavior before setting up a job
- **sendEmail() never throws** — always check `result.success` explicitly, not just catch blocks
- **504 on single product approve is transient** — caused by slow CJ API or Anthropic 529 overload on a specific product; not a systemic issue; retry resolves it
- **CJ API-only products have no public storefront URL** — `cjdropshipping.com/product/-p-{pid}.html` returns "Product removed" for most dropship items

**Key files modified in Session 28:**
- `app/api/auto-import/suggest/route.ts` — x-auto-import-secret header auth + email error fix (UPDATED)
- `app/admin/auto-import/page.tsx` — larger images, CJ PID copy, View Product link, Array.from fix (UPDATED)
- `lib/email/templates/auto-import-digest.ts` — 800px width, 2-column layout (UPDATED)

**Commits in Session 28:**
- `0d90191 feat: add x-auto-import-secret header auth for cron-job.org trigger`
- `727c901 fix: zero-stock detection in catalog health check`
- `35d29bd fix: digest email result was silently swallowed, add proper logging`
- `df3fb38 fix: email template 800px width + 2-column product grid`
- `1fd421d feat: larger images, CJ PID copy, and View Product link in auto-import admin UI`
- `fix: use Array.from instead of spread for Set iteration`

**Cron-job.org Configuration:**
- Title: MooreItems Auto Import
- URL: `https://mooreitems.com/api/auto-import/suggest` (non-www — www redirects and cron-job.org won't follow)
- Method: POST
- Schedule: Daily at 8:00 AM EST (America/New_York)
- Header: `x-auto-import-secret: mooreimp2026`
- Failure notification: enabled

---

### Session 29 (Mar 7): Catalog Health Check Investigation & Fix

**Trigger:** Health check alert email arrived at 3:07 AM reporting 23% health score and 2,019 issues — all flagged as "Zero-stock variants HIGH, 2,019 products affected." Appeared catastrophic.

#### Investigation Finding: False Alarm

The health check was broken in two ways:
1. **Counting variants, not products** — every individual zero-stock variant was counted as a separate issue. A single product with 10 OOS size variants = 10 "issues."
2. **Ignoring existing status** — products already correctly marked `out_of_stock` or `hidden` were being counted as open problems despite already being handled.

**Diagnostic queries run (key results):**
- `last_synced_at MAX` on zero-stock variants = `2026-03-07 13:10:54` — sync was fresh, not stale
- Products with ALL variants at zero stock: **519**
- Products with ONLY SOME variants at zero (partial, normal): **179**
- Products with any zero/null stock variant: **661**
- Total zero-stock variants in DB: **3,409**
- Health check was reporting **2,019** — none of these numbers match, confirming the script was computing something undefined

**Status breakdown of the 519 fully-OOS products:**
- `out_of_stock`: 423 — already correctly handled ✓
- `hidden`: 88 — intentionally hidden ✓
- `active`: **8** — genuinely slipped through, needed fixing ✗

**The 8 active zero-stock products:**
- Dog Sound Toy Molar Long Lasting Plush Toy
- Cable Management Storage Organizer Box
- Crystal Hair Removal Eraser Tool
- Special Shaped Crystal Copper Wire Braided Gem Ring
- Luxurious Fashion Diamond Pendant Necklace Set
- Electric Attic Lift Hoist - 2200 Lbs Capacity
- Portable Rechargeable Electric Shaver, Wet & Dry
- Character Wall Hanging Art Decoration

All 8 last synced 3+ days ago — missed a status update cycle. Fixed via:
```sql
UPDATE mi_products p
SET status = 'out_of_stock', updated_at = NOW()
WHERE p.status = 'active'
AND NOT EXISTS (
  SELECT 1 FROM mi_product_variants v
  WHERE v.product_id = p.id AND v.stock_count > 0
);
```

#### Health Check Script Fixes (commit 727c901 — applied in Session 28)

Three fixes implemented by Claude Code:

1. **Correct zero-stock definition** — Changed from flagging individual variants with `stock_count = 0` to flagging whole products where `status = 'active'`, they have active variants, but no variant has `stock_count > 0`. Products already `out_of_stock` or `hidden` excluded entirely.

2. **Health score correction** — Script now counts products (not variants) and only counts genuinely unaddressed zero-stock products. `needsAttention = totalIssues - totalAutoFixed` reflects only unresolved problems.

3. **Auto-fix improved** — Instead of inflating `stock_count` to 100 (which masked real stockouts and fought the webhook system), auto-fix now sets product `status = 'out_of_stock'`. Prevents 8-product slippages from accumulating between runs.

#### Key Schema Learnings (confirmed this session)
- Variants table: `mi_product_variants` (not `mi_variants`)
- Stock column: `stock_count` (not `stock`)
- Product status column: `status` (text: `active`, `out_of_stock`, `hidden`) — no `is_active` boolean
- Category join: `mi_products.category_id` → `mi_categories.id` (not `mi_products.category`)

#### Real Catalog Health (post-fix)
- **~2,573 active products** (was ~2,581 before fixing 8)
- **423 correctly marked out_of_stock** — inventory pipeline working
- **88 hidden** — intentionally curated
- **179 partial stockouts** — normal variant-level fluctuation, not a concern
- **8 slipped products fixed** — now marked out_of_stock
- Health check will report accurately on next 3 AM run

#### Stock Sync Cron Confirmed Healthy
- `stock-sync-background` Netlify function: fires at 4:00 AM daily via cron-job.org
- Returns `202 Accepted` (correct for background functions — async handoff)
- Response time: ~530ms (handoff only; actual sync runs in background)
- Last successful variant sync: `2026-03-07 13:10:54 UTC`

**Key files modified in Session 29:**
- Health check script (route or lib file) — zero-stock logic corrected, auto-fix improved (commit `727c901`)
- 8 products fixed directly in DB via SQL (no code change needed)

### Session 29 (Mar 7): Catalog Health Check Investigation & Fix

**Trigger:** Health check alert email arrived at 3:07 AM reporting 23% health score and 2,019 issues — all flagged as "Zero-stock variants HIGH, 2,019 products affected." Appeared catastrophic.

#### Investigation Finding: False Alarm

The health check script was broken in two ways:
1. **Counting variants, not products** — every individual zero-stock variant was counted as a separate issue. A single product with 10 OOS size variants = 10 "issues."
2. **Ignoring existing status** — products already correctly marked `out_of_stock` or `hidden` were being counted as open problems despite already being handled.

**Diagnostic queries run (key results):**
- `last_synced_at MAX` on zero-stock variants = `2026-03-07 13:10:54` — sync was fresh, not stale
- Products with ALL variants at zero stock: **519**
- Products with ONLY SOME variants at zero (partial, normal): **179**
- Total zero-stock variants in DB: **3,409**
- Health check was reporting **2,019** — none of these numbers match, confirming the script was computing something undefined

**Status breakdown of the 519 fully-OOS products:**
- `out_of_stock`: 423 — already correctly handled ✓
- `hidden`: 88 — intentionally hidden ✓
- `active`: **8** — genuinely slipped through, needed fixing ✗

**The 8 active zero-stock products fixed:**
- Dog Sound Toy Molar Long Lasting Plush Toy
- Cable Management Storage Organizer Box
- Crystal Hair Removal Eraser Tool
- Special Shaped Crystal Copper Wire Braided Gem Ring
- Luxurious Fashion Diamond Pendant Necklace Set
- Electric Attic Lift Hoist - 2200 Lbs Capacity
- Portable Rechargeable Electric Shaver, Wet & Dry
- Character Wall Hanging Art Decoration

Fixed via SQL — set `status = 'out_of_stock'` on all 8.

#### Health Check Script Fixes (commit `727c901`)

Three fixes implemented:
1. **Correct zero-stock definition** — Changed from flagging individual variants with `stock_count = 0` to flagging whole products where `status = 'active'` AND no variant has `stock_count > 0`. Products already `out_of_stock` or `hidden` excluded entirely.
2. **Health score correction** — Script now counts products (not variants) and only counts genuinely unaddressed zero-stock products.
3. **Auto-fix improved** — Instead of inflating `stock_count` to 100 (which masked real stockouts and fought the webhook system), auto-fix now sets product `status = 'out_of_stock'`.

#### Key Schema Learnings (confirmed this session)
- Variants table: `mi_product_variants` (not `mi_variants`)
- Stock column on variants: `stock_count` (not `stock`)
- Product status column: `status` (text: `active`, `out_of_stock`, `hidden`) — no `is_active` boolean
- Category join: `mi_products.category_id` → `mi_categories.id` (not `mi_products.category`)

#### Stock Sync Cron Confirmed Healthy
- `stock-sync-background` Netlify function fires at 4:00 AM daily via cron-job.org
- Returns `202 Accepted` — correct for Netlify background functions (async handoff, not a 200)
- Last successful variant sync: `2026-03-07 13:10:54 UTC`

#### Real Catalog Health (post-fix)
- 423 products correctly marked `out_of_stock` — inventory pipeline working as designed
- 88 hidden — intentionally curated
- 179 partial stockouts — normal variant-level fluctuation, not a concern
- 8 slipped products fixed and marked `out_of_stock`
- Health score will reflect reality on next 3 AM run

**Also update line 7** — change `(Session 27)` to `(Session 29)` and append to the status line: `Catalog health check script fixed — was generating false alarms (2,019 phantom issues); real catalog health confirmed strong.`

---

## Session 32 (Mar 7, 2026): Landing Pages System — Full Build

### What Was Built

Complete landing page system for paid ad traffic. Every landing page lives at `/lp/[slug]`, is completely separate from the regular product catalog page, and is purpose-built for ad conversion with no site nav distractions.

### Database Changes
- Added columns to `mi_landing_pages`: `product_id` (uuid, FK to mi_products), `template` (text), `sections` (jsonb), `quantity_discounts` (jsonb), `promo_codes` (jsonb), `ai_generated_at` (timestamptz), `published_at` (timestamptz), `status` (text: 'draft'|'live')
- Note: table has both legacy `product_ids` array AND new `product_id` single column — builder uses `product_id`
- `status` field maps to `is_active` boolean in some API routes — be aware of this dual-field pattern

### New Files

**Admin Pages:**
- `app/admin/landing-pages/page.tsx` — Full list page: table with Name, Product, Status (Live/Draft), Views, Conversions, Conv Rate, Created. Row actions: Edit, Preview, Toggle Live/Draft, Delete
- `app/admin/landing-pages/new/page.tsx` — New landing page builder wrapper
- `app/admin/landing-pages/[id]/edit/page.tsx` — Edit wrapper, fetches existing record and passes as initialData
- `components/admin/LandingPageBuilder.tsx` — Shared builder (~500 lines): Product picker (From Catalog + CJ Import tabs), Page Settings (auto-fill on product select), Page Images (3 slots: Hero/Feature1/Feature2, thumbnail picker, AI picks on generate), Quantity Discount Tiers (3 rows, live price preview), AI Content Generation (Generate button → all sections as editable fields), Sticky save bar (Save as Draft + Publish)

**Public Pages:**
- `app/lp/[slug]/page.tsx` — Server component, generateMetadata, 404 if status != 'live'
- `app/lp/[slug]/LandingPageClient.tsx` — 9-section landing page: minimal header (logo+cart only), hero (navy, Playfair, gold subheadline, CTA scrolls to bundle), Bundle & Save selector (full-width immersive 50/50: LEFT = crossfade image gallery with pinned thumbnail strip, RIGHT = purchase panel with radio bundle rows + trust badges + "delivered in 2-5 days"), benefits strip, feature block 1, social proof bar, feature block 2, testimonials, FAQ accordion, closing CTA, minimal footer

**Image Gallery (Bundle Selector):**
- Fixed h-screen left column, overflow-hidden, no layout shift
- Two stacked absolute `<img>` layers for crossfade (0.4s opacity transition)
- Thumbnail strip: absolute bottom-0, semi-transparent navy bg, outline ring (not border) on selected
- e.preventDefault + e.stopPropagation on clicks, wrapped in startTransition

**API Routes:**
- `app/api/admin/landing-pages/route.ts` — GET list, POST create
- `app/api/admin/landing-pages/[id]/route.ts` — GET, PUT (sets published_at on first publish), DELETE
- `app/api/admin/landing-pages/generate/route.ts` — Claude Sonnet: writes all sections + selects best images from product_images array + auto-creates promo codes in mi_promo_codes (format: LP-[SLUG]-[QTY])
- `app/api/lp/track-view/route.ts` — Public POST, increments views by slug

**Cart + Webhook:**
- `app/cart/page.tsx` — URL param deep-linking: `?add=[productId]&qty=[n]&promo=[CODE]`
- `app/api/webhooks/stripe/route.ts` — trackLandingPageConversion() after successful orders

### Key Facts
- - Landing pages are invisible to organic traffic — no nav links to them (noindex added Session 33 ✅)
- Promo codes are required for bundle discounts to actually apply at checkout
- Regular `/product/[slug]` and `/lp/[slug]` coexist independently — deleting a landing page never affects the product
- AI picks images during generation; user can swap any slot afterward in the builder
- Draft pages return 404 publicly; only Live pages are accessible

### Bug Fixes
- Edit link was `/admin/landing-pages/[id]` instead of `/admin/landing-pages/[id]/edit`
- CJ import preview called non-existent `/api/admin/verify-product` → fixed to use import-cj route with preview:true
- Promo upsert targeted `mi_discount_codes` → fixed to `mi_promo_codes`
- Sidebar showed Landing Pages as "Coming Soon" → removed badge, enabled as active link
- "Ships in 2-5 business days" → "Delivered in 2-5 business days" on landing page

### Catalog Stats (Session 32)
- 3,313 total products (US: 3,221 · CN: 91)
- 2,613 active · 250 hidden · 450 out of stock
- 3,260 categorized · 0 uncategorized ✅ (1 remaining product categorized Session 33)

---

## Session 33 (Mar 7, 2026): Catalog Cleanup, Homepage Polish & UI Improvements

### What Was Done

Quick maintenance and visual improvement session — no new features, all refinements and UX improvements.

### Catalog
- **Last uncategorized product fixed** — ran `node scripts/ai-categorize-remaining.js --apply`; only 1 product remained (previous sessions had already cleaned the rest — counter was stale). "Plastic Waterproof Tool Box" → Tools & Hardware. Catalog is now 100% categorized.

### Landing Pages
- **noindex added to `/lp/[slug]`** — `app/lp/[slug]/page.tsx` `generateMetadata` now returns `robots: { index: false, follow: false }`. Prevents duplicate content issues and crawl budget waste as landing page count grows.

### Homepage Improvements
- **Hero headline** — Changed "Discover Moore." to "Moore Items. More Savings." Each phrase wrapped in `<span className="block">` for two-line stacked layout.
- **Hero image filter** — Query now joins `mi_categories!inner` filtered to lifestyle-only slugs: `fashion`, `jewelry`, `home-furniture`, `kitchen-dining`, `pet-supplies`, `kids-toys`, `health-beauty`, `garden-outdoor`. Fetches top 40 by sales. Excludes `tools-hardware` and `electronics` permanently — prevents spec/diagram/CAD images from appearing in hero.
- **Social proof line in hero** — Added `★★★★★ Trusted by 10,000+ happy shoppers` directly below subtitle in muted gold (#c9a96e), text-sm, DM Sans.
- **Animated hero grid** — New `components/storefront/HeroGrid.tsx` client component. Every 4 seconds fades out one slot (0.4s opacity transition), swaps in a random product from the fetched pool, fades back in. Rotates through all 4 slots sequentially.
- **Hero overflow fix** — Section set to `min-h-screen max-h-screen overflow-hidden`; inner container uses `h-screen flex items-center`; HeroGrid root div gets `h-full`. Images no longer push past viewport bottom.
- **Stats bar update** — Replaced ShieldCheck / "100% Secure Checkout" with Sparkles / "AI Shopping Assistant" — differentiates MooreItems from generic stores.

### Footer
- **Logo replaced with text wordmark** — Removed `<Image>` circular logo from `components/layout/Footer.tsx` (was clashing visually on navy background). Replaced with plain text: `Moore` in white + `Items` in gold (#c8a45e), Playfair Display. Unused Image import also removed.

### Global UI
- **Gold scrollbar** — Added to `app/globals.css`: 8px width, transparent track, #c8a45e thumb, #b8944e on hover. Matches brand palette.

### Product Scout Fix
- **Search relevance re-sort** — CJ API was returning results by its own default order (sales rank), causing irrelevant keyword matches to surface first (e.g. "Pet Hair Comb with Plastic **Teeth**" appearing before actual teeth whitening products when searching "teeth whitening"). Added `scoreByRelevance()` client-side sort after CJ results load: +10 for exact phrase match in name, +3 per individual word match, +1 scaled by word position (earlier = higher). On paginated "load more", full combined set is re-sorted so relevance stays consistent across pages. No API changes — purely client-side.

### Design System Note
- **DESIGN-SYSTEM.md recommended** — Create a `DESIGN-SYSTEM.md` in project root for Claude Code to read before UI work. Skills system only exists in Claude.ai chat, not Claude Code. Workaround: prefix UI prompts with "Read DESIGN-SYSTEM.md first, then...". File should document: brand colors, fonts, tone, and things to avoid (spec images in hero, purple gradients, etc.).

### Key Facts
- Hero image pool draws from 8 lifestyle categories only — tools/electronics excluded permanently
- `HeroGrid.tsx` is a new client component; hero section in `app/page.tsx` is server-rendered
- Footer no longer uses the `<Image>` component for logo
- $0 prices observed locally — confirmed production pricing is correct; local `.env.local` DB has stale data (not a code issue)
- SSL cert confirmed healthy — Let's Encrypt, covers mooreitems.com + www, auto-renews May 2026

### Files Modified
- `app/lp/[slug]/page.tsx` — robots noindex in generateMetadata
- `app/page.tsx` — hero text, image filter, social proof line, stats bar, overflow fix
- `components/storefront/HeroGrid.tsx` — NEW: animated hero grid client component
- `components/layout/Footer.tsx` — replaced Image logo with text wordmark
- `app/globals.css` — gold scrollbar styles
- `app/admin/product-scout/page.tsx` — relevance re-sort for search results

### Commits
- `Homepage improvements: hero text, image filter, social proof, animated grid, stats bar`
- `Hero layout fix, stacked headline, footer wordmark`
- `Gold scrollbar styling`
- `Product Scout: relevance re-sort for search results`

---

## Session 34 (Mar 8, 2026): UX Polish — Search, Ticker, Hero Grid, Category Descriptions, AI Image Tagging

### Bug Fixes

**Search results page hardcoded warehouse CN:**
- Root cause: `app/search/page.tsx` line 92 had `warehouse: 'CN'` hardcoded in the client-side product mapping, overriding whatever the API returned. Every product on the search results page was forced to CN regardless of actual warehouse data.
- Fix: Changed to `product.warehouse || 'CN'` — reads real value, falls back to CN only if missing.
- Secondary fix: `app/api/search/route.ts` — added `warehouse` to `.select()` fields (autocomplete dropdown fix).
- Secondary fix: `components/storefront/ProductCard.tsx` — changed from `warehouse === 'CN'` condition to `else` branch so products with `null`/`undefined` warehouse degrade to CN badge instead of showing no badge at all.
- Debug process: Confirmed via Supabase SQL that teeth whitening products had `warehouse: 'US'` in DB — ruled out data issue. Traced to client mapping in search page (not the API).

### Search Dropdown Improvements

**Popular Searches (replaces category pills):**
- Removed `CATEGORY_SUGGESTIONS` array and "Search in [Category]" pills — they were redundant with the mega menu nav.
- Added `POPULAR_SEARCHES` array of 12 curated terms: LED lights, wall art, jewelry organizer, kitchen gadgets, phone stand, yoga mat, essential oils, hair accessories, pet toys, desk organizer, throw pillows, face mask.
- Shown only when input is **empty** — disappear once user starts typing and product suggestions appear.
- Clicking a pill navigates to `/search?q=<term>` and closes dropdown.
- File: `components/storefront/SearchBar.tsx`

**"Searches Related To" pills:**
- Added below product results, above "View all results" link.
- Generates modifier suggestions from current query: raw query + kit, pen, set, for women.
- Filters to ≤40 chars. Only shows when `query.length >= 2` and results exist.
- Compact styling — smaller than popular search pills.
- File: `components/storefront/SearchBar.tsx`

### Ticker Fixes

**Seamless loop:**
- Previous 2-copy + `-50%` approach still showed gap on wide viewports.
- Fixed by rendering **4 copies** and translating `-25%` (one copy's width).
- Keyframe: `translateX(0%) → translateX(-25%)`, `30s linear infinite`.
- Removed `uppercase` Tailwind class from container — was overriding title-case string changes.
- File: `components/storefront/AnnouncementBar.tsx`, `tailwind.config.ts`

**Title case text:**
- "100% Secure Checkout", "Fast 2–5 Day US Delivery", "Free Shipping on $50+", "6,000+ Five-Star Reviews"

### Category Description Collapse

- Long AI-generated SEO descriptions (250+ words) collapsed to 120 chars by default with "Read more" link in gold `#c8a45e`.
- Full text stays in DOM (not conditionally rendered) — SEO value preserved.
- Toggle extracted into `components/storefront/CategoryDescription.tsx` as a `'use client'` component — required because `app/category/[slug]/page.tsx` is a server component and cannot use `useState` directly.
- File: `components/storefront/CategoryDescription.tsx` (NEW), `app/category/[slug]/page.tsx`

### Hero Grid Layout

- Multiple iterations to fix images overflowing viewport bottom.
- Final state: `h-[560px]` fixed height container in `app/page.tsx`, `object-cover object-center` on images, `gap-2` between cells, `min-h-[calc(100vh-120px)] flex items-center` on hero section.
- `HeroGrid.tsx` root div: `w-full h-full grid grid-cols-2 grid-rows-2 gap-2`.
- Files: `components/storefront/HeroGrid.tsx`, `app/page.tsx`

### AI Hero Image Eligibility Tagging

**Problem:** Homepage hero grid pulled from top best sellers by category but had no quality filter — spec diagrams, dimension drawings, infographic-heavy images, and mannequin shots appearing alongside lifestyle photos.

**Solution:** New `scripts/tag-hero-eligible.js` uses Claude Haiku vision API to evaluate each product's primary image and tag it `hero_eligible = true/false`.

**Database:**
```sql
ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS hero_eligible BOOLEAN DEFAULT false;
ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS hero_checked_at TIMESTAMPTZ DEFAULT NULL;
```
- `hero_eligible` — true if image passes quality check
- `hero_checked_at` — timestamp set on every processed product (prevents re-evaluation on re-runs; rate-limit-safe)

**Script behavior:**
- Fetches active products where `hero_checked_at IS NULL` with non-null images
- Sends `images[0]` to `claude-haiku-4-5-20251001` via vision API with PASS/FAIL criteria:
  - PASS: lifestyle photos, clean product shots, fashion on models, home decor in styled settings, jewelry closeups
  - FAIL: dimension diagrams, spec drawings, before/after medical images, infographics with text overlay, ingredient labels as main image, collages with measurements
- Returns `{ eligible: bool, reason: string }` JSON
- Processes 5 per batch, 15s delay between batches (avoid 50K token/min rate limit)
- Writes both `hero_eligible` and `hero_checked_at` per product
- Supports `--dry-run` and `--apply` flags
- File: `scripts/tag-hero-eligible.js` (NEW)

**Results:** 635 eligible / 365 not eligible / 0 errors across 1,000 products evaluated.

**Homepage integration:** `app/page.tsx` hero query now includes `.eq('hero_eligible', true)` to filter approved images only.

**Rate limit lessons:**
- Haiku vision requests are token-heavy (~500 tokens/image)
- 50,000 token/min org limit hit at batch size 20 with 3s delay
- Fixed at batch size 5 with 15s delay — ~30 min for 600 products
- First partial run (batch 20, 3s delay) left 550 products with `hero_eligible=false` (default) and no `hero_checked_at` — `hero_checked_at IS NULL` filter correctly excludes already-processed products on re-run

### Key Facts (Session 34)
- `warehouse` column defaults to `'CN'` in DB — always explicitly write `'US'` for US warehouse products at import time
- `app/search/page.tsx` client mapping is a distinct transform layer separate from the API — bugs can exist there even when API data is correct
- Category page is a server component — any interactive UI (toggles, modals) must be extracted to separate `'use client'` components
- Hero eligibility script is re-runnable safely — `hero_checked_at` prevents double-processing
- Re-run the script periodically as new products are imported (fetch filter: `hero_checked_at IS NULL`)

### Files Created/Modified (Session 34)
- `app/search/page.tsx` — warehouse mapping fix (hardcoded `'CN'` → `product.warehouse || 'CN'`)
- `app/api/search/route.ts` — added `warehouse` to `.select()` fields
- `components/storefront/ProductCard.tsx` — warehouse badge fallback changed to `else` branch
- `components/storefront/SearchBar.tsx` — popular searches (empty state), "searches related to" pills, category pills removed
- `components/storefront/AnnouncementBar.tsx` — 4-copy ticker loop, title case text, `uppercase` class removed
- `tailwind.config.ts` — ticker keyframe `translateX(0%) → translateX(-25%)`, 30s
- `components/storefront/CategoryDescription.tsx` — NEW client component for description collapse toggle
- `app/category/[slug]/page.tsx` — uses `<CategoryDescription>` instead of inline useState
- `components/storefront/HeroGrid.tsx` — layout fixes: `w-full h-full`, `object-cover`, `gap-2`
- `app/page.tsx` — hero section layout, `.eq('hero_eligible', true)` filter, console.log removed
- `scripts/tag-hero-eligible.js` — NEW vision evaluation script
- Supabase: `hero_eligible BOOLEAN DEFAULT false`, `hero_checked_at TIMESTAMPTZ` columns added to `mi_products`

### Commits
- `fix: search results page hardcoded warehouse CN`
- `fix: ticker seamless loop with 4 copies at -25% translate`
- `fix: ticker uppercase removed, seamless loop corrected`
- `feat: search popular searches and related pills, category description collapse`
- `feat: hero grid filters hero_eligible products only`

---

**Major Milestone (Mar 8 — Session 35):** Admin UI improvements, critical LP checkout bug fix, product image management overhaul, and What's Included LP section.

**Admin Product Edit Page — Image Management:**
- Added Upload Image button (POSTs to `/api/admin/landing-pages/upload-image`, reuses existing endpoint)
- Added URL paste input with Add button
- Same UX pattern as Landing Page Builder image management
- Existing delete/reorder/set-as-main controls untouched

**Inline Price Editing (Landing Page Builder + Product Edit):**
- Landing Page Builder pricing bar: Sell Price and Your Cost now clickable inline-edit fields
- Click to edit → number input with gold border → blur/Enter saves via PATCH → green checkmark 1.5s
- Quantity discount Price Preview recalculates live
- Product edit page: `cj_price` (Your Cost) field added alongside retail_price in 2-column grid

**Product Images — object-contain Fix:**
- `components/storefront/ImageGallery.tsx` and `components/product/ProductGallery.tsx`: `object-cover` → `object-contain` + `bg-white` on main image and thumbnails
- Landing page hero: `object-cover` → `object-contain` + `bg-[#f7f6f3]` (cream) on gallery container, overlay image, and thumbnails
- Prevents any image from being cropped — full image always visible

**Critical LP Bundle Discount Bug Fixed (was silently overcharging customers):**
- Root cause: LP promo codes written to `mi_promo_codes` but checkout reads `mi_discount_codes` — table mismatch meant bundle discounts NEVER applied at Stripe checkout
- Fix: `app/api/admin/landing-pages/generate/route.ts` now writes to `mi_discount_codes` with `min_order_amount: 0` and `code_type: 'general'`
- Cart qty price revert: `CartItem` type extended with `originalPrice?` and `bundleDiscount?: { qty, pct }` — when qty drops below threshold, `updateQuantity()` reverts to `originalPrice`
- `LandingPageClient.tsx` now passes `originalPrice` and `bundleDiscount` metadata when adding to cart
- Warehouse default inconsistency fixed: `product.warehouse || 'CN'` → `product.warehouse || 'US'` in checkout route

**LP Image Stale Cache — Long-Term Fix:**
- Problem: `gallery_images` in `mi_landing_pages.sections` stored absolute supplier URLs — when product images updated, LP still served old cached URLs
- Three-layer solution:
  1. **On product image update** (PATCH handler): auto-clears `gallery_images` to `[]` on any LP linked to that product; clears `feature1_image`/`feature2_image` only if URL no longer in new images array; preserves `hero_image_url` (separate column)
  2. **On LP edit load** (hydration): `isValidImageUrl()` helper filters `gallery_images` against current `product.images` — stale alicdn/supplier URLs dropped, custom Supabase uploads always preserved
  3. **On save**: `cleanGalleryImages` filters with both `removedProductImages` AND `isValidImageUrl()` — belt-and-suspenders
- `app/lp/[slug]/page.tsx`: added `export const dynamic = 'force-dynamic'` and `export const revalidate = 0` — was being cached by Next.js
- PUT handler: added `revalidatePath('/lp/${slug}')` calls — instant cache bust on save
- One-time SQL fix for existing stale record: `UPDATE mi_landing_pages SET sections = jsonb_set(sections, '{gallery_images}', '[]') WHERE slug = 'travel-vacuum-storage-bags-with-pump'`

**LP Gallery Count Bug Fixed:**
- "9 of 6 selected" count was wrong — `selected` was `galleryImages` which could contain removed URLs not in `allImgs`
- Fix: `selected` now filters `galleryImages` to only URLs present in `allImgs`
- `removeProductImage()` now also removes URL from `galleryImages` state immediately

**What's Included LP Section:**
- Toggle in LP builder: "Show 'What's Included' section" (checkbox only)
- Single textarea: paste items one per line starting with `-`
- Format: `- Title – Description` (splits on ` – ` separator)
- Saves as `whats_included_enabled` (boolean) + `whats_included_text` (string) in `sections` JSONB
- Live LP renders: splits by newline → strips leading `- ` / `– ` → splits on separator → title (navy bold) + description (gray) cards
- Grid: 2-col mobile, 3-col desktop, cream `#f7f6f3` cards
- Renders between Social Proof and Feature Block 2 when enabled
- Works for any product — no hardcoded content

**AliExpress Sourcing Notes:**
- Do NOT use supplier videos in paid Meta ads (copyright risk, Meta can flag/reject)
- Supplier product images on product page = generally okay (supplier implicit permission to sell)
- Best practice: film own footage when sample arrives for video ads
- Static image ads with product photos safe to run now while waiting for sample

**Vacuum Bag Product — Pending:**
- Cost still needs correcting: `cj_price` $9.50 → $16.87 (actual AliExpress cost with fees)
- What's Included text to add: rechargeable pump specs, 15 bags in 3 sizes, USB cable, dual-zipper material


---

### Session 36 (Mar 9, 2026): Auto-Import Dedup Fix, Approve Timeouts, Polish Ungated, Shipping Tiers, Email Pipeline Overhaul, SendGrid Domain Auth

#### Auto-Import Pipeline Fixes

**Catalog dedup overhaul:**
- Old: `.in('cj_pid', pids)` only checked products in the current batch — missed everything outside that batch
- New: fetches ALL non-null `cj_pids` from `mi_products` upfront with `.not('cj_pid', 'is', null)` — catches every existing product regardless of batch
- Suggestions dedup: removed `.eq('status', 'pending')` filter — now excludes ALL previously seen suggestions (approved, rejected, imported, error) so same product never re-surfaces
- Multi-page fetch: added `randomPages()` helper, now fetches 3 random pages from 1–100 (was 1 page from 31–80) for more catalog diversity
- 4 console.log statements added at each dedup stage — Netlify logs now show exact candidate counts at every step
- Root cause of "no email this morning": CJ token had expired, auth failed silently before reaching any candidates, early return fired with no log

**CJ token expiry fix:**
- When token expires, deleting the `cj_access_token` row from `mi_settings` forces re-auth on next call
- Do NOT clear the value (null) — `value` column has NOT NULL constraint, causes 23502 error
- Delete the entire row instead

**Approve route timeouts (AbortController):**

| Call | Timeout | Behavior on abort |
|------|---------|-------------------|
| `cjClient.getProduct()` | 10s | Throws — import fails |
| `cjClient.getProductStock()` | 10s | Swallowed — falls back to 0 stock |
| `cjClient.calculateFreight()` | 10s | Swallowed — falls back to estimated shipping |
| `categorizeWithAI()` | 20s | Returns null — falls back to keyword matching |
| `anthropic.messages.create()` (rewrite) | 20s | Falls back to raw stripped description |

- Review generation moved AFTER product saved to DB and suggestion marked `imported` — reviews never block import
- `lib/cj/client.ts` — `authenticate()`, `apiCall()`, `getProduct()`, `getProductStock()`, `calculateFreight()` all accept optional `signal`
- `lib/ai/product-enrichment.ts` — `categorizeWithAI()` accepts optional `signal`

#### Polish Button Ungated

- Previously: Polish (Sparkles) button only rendered for products with `cj_pid`
- Fix: removed `{product.cj_pid && (...)}` wrapper in both product row (~line 948) and preview modal (~line 1202) in `app/admin/products/page.tsx`
- Polish API route never referenced `cj_pid` — no API changes needed
- AliExpress, manually-added, and any future non-CJ products now get full Polish support (name rewrite, description rewrite, review generation)

#### Admin Shipping Cost Field

- Added `shipping_cost` field to product edit page pricing grid (`app/admin/products/edit/[id]/page.tsx`)
- Changed from 2-column to 3-column pricing grid (cj_price | retail_price | shipping_cost)
- Helper text: "Charged at checkout. Set to 0 for free shipping."
- Saves to existing `shipping_cost` column via existing PATCH handler
- Margin calculation now uses `form.shipping_cost` live (not `originalProduct.shipping_cost`)
- Old static read-only "+ $X.XX shipping" text removed

#### Checkout Shipping Tiers

Replaced hardcoded flat shipping with weight-based Stripe `shipping_options`:

| Scenario | Options shown |
|----------|--------------|
| All digital | None (no shipping) |
| US-only, subtotal ≥ $50 | Free ($0) |
| US-only, weight < 500g | $1.99 Standard |
| US-only, weight 500g–11340g | $4.99 Standard |
| US-only, weight > 11340g (25 lbs) | $9.99 Standard |
| CN-only, subtotal < $50 | $6.99 International only |
| CN-only, subtotal ≥ $50 | Free + $6.99 International |
| Mixed, subtotal < $50 | US weight rate + $6.99 International |
| Mixed, subtotal ≥ $50 | Free + $6.99 International |

- Free option always listed first (Stripe auto-selects it)
- `minShippingCost` used for preliminary `mi_orders` insert
- Webhook reads `session.total_details.amount_shipping` (cents → dollars) and saves actual charged amount + `session.amount_total` to `mi_orders` on payment
- Display names cleaned to remove timeframe text (was showing "(2-5 business days)" twice — Stripe renders delivery_estimate separately)
- Old `calculateShippingCost`, `calculateFlatRateShipping`, `ShippingItem`, `getShippingConfig` imports removed

**Key shipping note:** AliExpress/manually-added products have no `cj_raw_data.productWeight` — weight logs as NULL and defaults to 0g → $1.99 tier. Fix: manually set weight on product edit page.

#### Email Pipeline Overhaul

**Root cause of all email failures — three bugs fixed:**

1. **`customer_email` column always null** — webhook never wrote to this column; all guest order email sends were going to null. Fix: webhook now sets `customer_email: session.customer_details?.email || session.customer_email || null` on order update.

2. **Email recipient fallback chain** — replaced single `customerEmail` variable with 3-way fallback:
   `session.customer_details?.email → session.customer_email → order.email`
   Both `sendOrderConfirmation()` and `sendNewOrderAdminNotification()` use `toEmail`.

3. **Admin alert gated on CJ** — admin new-order notification was inside a block that only fired for CJ products. Restructured so admin alert fires for ALL paid orders unconditionally.

**Admin order email fixes (`lib/email/templates/new-order-admin.ts`):**
- Added shipping address section (name, line1, line2, city, state, ZIP, country) after customer info box
- Subject changed: `New Order #MI-123 — John ($45.00)` → `New Order Received — #MI-123 · John`
- "Fund This Order in CJ" button replaced with "View Order in Admin" linking to `/admin/orders?highlight={orderId}` — works for all order types
- `orderId` and `shippingAddress` now passed from webhook

**Webhook column mismatch fix (root cause of blank items in ALL emails):**
- DB columns on `mi_order_items` are `name` and `image_url`
- Webhook SELECT was reading non-existent `product_name` and `product_image` — returned null silently
- Fixed all 6 references across lines 106, 128, 140, 143, 183, 276, 291-292
- Affected: order confirmation, admin alert, AND abandoned cart emails — all had blank product names since launch

#### SendGrid Domain Authentication — Root Domain Fix

**Problem:** `orders@mooreitems.com` rejected with 403 "from address does not match a verified Sender Identity"
- `em1974.www.mooreitems.com` was verified but only covers `@www.mooreitems.com` subdomain
- Root domain `@mooreitems.com` addresses were not covered

**Fix:** Authenticated `mooreitems.com` root domain in SendGrid + added 4 DNS records to Namecheap:

| Type | Host | Value |
|------|------|-------|
| CNAME | `em1645` | `u56908559.wl060.sendgrid.net` |
| CNAME | `s1._domainkey` | `s1.domainkey.u56908559.wl060.sendgrid.net` |
| CNAME | `s2._domainkey` | `s2.domainkey.u56908559.wl060.sendgrid.net` |
| TXT | `_dmarc` | `v=DMARC1; p=none;` |

- `SENDGRID_FROM_EMAIL` updated to `orders@mooreitems.com` in Netlify (all deploy contexts)
- Domain verified ✅ — `orders@mooreitems.com` and any `@mooreitems.com` address now works as sender
- SendGrid reputation: 100%
- Emails confirmed delivered (previously deferred with DMARC 421 4.7.32 alignment error)

**Key learnings:**
- SendGrid domain auth for `www.mooreitems.com` does NOT cover root `@mooreitems.com` addresses — must authenticate root domain separately
- `customer_email` column in `mi_orders` is always null for guest orders — `email` column is the correct one to use
- Webhook column mismatches (reading non-existent columns) fail silently with null — no error thrown, no log
- `mi_settings` `value` column has NOT NULL constraint — delete row to clear token, don't null the value
- New sender domain goes to spam initially — mark as not spam + add to contacts to train Gmail; resolves with sending volume over 1-2 weeks

**Key files modified in Session 36:**
- `app/api/auto-import/suggest/route.ts` — full catalog dedup, all-status suggestion exclusion, randomPages(), 4 stage logs (UPDATED)
- `lib/cj/client.ts` — AbortController signal support on authenticate/apiCall/getProduct/getProductStock/calculateFreight (UPDATED)
- `lib/ai/product-enrichment.ts` — AbortController signal support on categorizeWithAI (UPDATED)
- `app/api/auto-import/approve/route.ts` — timeouts on all external calls, reviews non-blocking post-save (UPDATED)
- `app/admin/products/page.tsx` — Polish button ungated from cj_pid (UPDATED)
- `app/admin/products/edit/[id]/page.tsx` — shipping_cost field added to pricing grid (UPDATED)
- `app/api/checkout/route.ts` — weight-based shipping tiers, Stripe shipping_options, old flat-rate system removed (UPDATED)
- `app/api/webhooks/stripe/route.ts` — customer_email written on payment, toEmail fallback chain, admin alert unconditional, actual shipping/total saved from Stripe, column names fixed name/image_url (UPDATED)
- `lib/email/templates/new-order-admin.ts` — shipping address section, View Order button, subject line, orderId param (UPDATED)
- `lib/email/sendgrid.ts` — subject line updated (UPDATED)

**Commits in Session 36:**
- `fix: auto-import dedup — full catalog scan, all-status suggestion exclusion, randomPages, stage logging`
- `fix: approve route AbortController timeouts, reviews non-blocking`
- `fix: Polish button ungated from cj_pid — works for all product types`
- `fix: admin shipping cost field in product edit pricing grid`
- `fix: weight-based checkout shipping tiers, Stripe shipping_options`
- `fix: remove duplicate delivery timeframe from shipping option labels`
- `fix: order email recipient fallback, customer_email column, admin alert unconditional`
- `fix: admin order email — shipping address, line items, view order button, subject line`
- `fix: order email items blank — webhook was reading non-existent product_name/product_image columns, correct columns are name/image_url`
- `chore: update SendGrid from address to orders@mooreitems.com`


### Session 35 (Mar 10, 2026): Import System Overhaul & Dashboard Command Center

**Image extraction fix** (`lib/cj/sync.ts`):
- `extractImagesFromDetail()` now builds complete image array: productImage first → variant images (variants[].variantImage) → productImageSet gallery → Array.from(new Set()) dedup
- All 5 CJ import call sites benefit: scout import, scout search, manual CJ import, auto-import approve, main sync

**Canonical AI polish** (`lib/ai/product-enrichment.ts`):
- Added `polishProductWithAI({ rawTitle, rawDescription, categoryHint })` — single shared function
- Outputs: title (max 80 chars), description (max 300 chars lifestyle copy), whatsIncluded[] (what's in the box, max 5 items)
- Graceful fallback: returns raw inputs unchanged on any failure
- Wired into scout/import and auto-import/approve — both routes now use this instead of divergent inline prompts

**Database migrations** (Supabase):
- `mi_products.supplier` text column added (default 'cj', backfilled from cj_pid presence)
- `mi_auto_import_suggestions.supplier` and `.source_url` columns added
- `mi_products.whats_included` text[] column added (default '{}')
- `mi_settings` key `last_health_check_result` — health check route now upserts `{score, checked_at}` after every run

**Unified import hub** (`app/admin/catalog/import/page.tsx`):
- 4-tab page: AI Suggestions, Browse CJ, Paste URL/PID, Manual Entry
- `components/admin/AutoImportPanel.tsx` — extracted from auto-import page
- `components/admin/ProductScoutPanel.tsx` — extracted from product scout page
- Paste URL tab: two-step preview (GET /api/admin/verify-product) → import (POST /api/admin/scout/import), handles 409 already-exists
- Manual Entry tab: full inline product creation form with AI Polish button, same logic as /admin/products/add
- `/admin/auto-import` and `/admin/product-scout` now redirect to `/admin/catalog/import`

**Sidebar consolidated** (`components/admin/Sidebar.tsx`):
- Removed: Add Product, Import from URL, Product Scout, Auto Import, US Stock (5 items)
- Added: Import Products → /admin/catalog/import
- New structure: STORE (Dashboard, Products, Import Products) / OPERATIONS (Orders, Customers, Promo Codes, Landing Pages) / TOOLS (Catalog Health) / SETTINGS (Pricing, Shipping)

**Add Product page cleaned up** (`app/admin/products/add/page.tsx`):
- Removed CJ Import tab (now redundant with import hub)
- Added AI Polish button — inline with Product Name field, calls polishProductWithAI(), updates name + description + stores whatsIncluded

**QPS fix** — auto-import suggest and approve routes now have await sleep(1100) between sequential CJ API calls. Prevents 1600200 QPS errors when clicking Run Now manually.

**Dashboard command center** (`app/admin/page.tsx` + `app/api/admin/dashboard/route.ts`):
- 7th stat card: Pending Imports (amber when > 0, links to /admin/catalog/import)
- Catalog Health bar: green/amber/red tinted full-width bar with score + relative timestamp, links to /admin/catalog-health
- Needs Polish subtitle: shows price drift count in amber or "All prices stable" in grey
- Quick Actions: "Import Products" replaces "Add Product"
- Dashboard API: added pendingImports, healthScore, healthCheckedAt to response

**whatsIncluded end to end**:
- All import paths save to `mi_products.whats_included` text[] column
- Product detail page (`ProductPageClient.tsx`) renders gold ✓ checklist above description when array has items
- Manual form Polish button captures whatsIncluded and submits with product
- Existing catalog has empty arrays — backfill script needed to populate historical products

**Key architectural decisions**:
- `lib/cj/sync.ts extractImagesFromDetail()` = canonical image extractor for all CJ paths
- `lib/ai/product-enrichment.ts polishProductWithAI()` = canonical AI polish for all import paths
- `supplier` column on mi_products = foundation for future multi-supplier (AliExpress, Topdawg, etc.)
- whatsIncluded stored as structured array, not appended to description text

**On the horizon**:
- Backfill whatsIncluded on existing ~3,000 products
- AliExpress URL adapter for Paste URL tab
---

## Session 36 (Mar 11, 2026): UI/UX Skill, CLAUDE.md, Hero Redesign, Hero Image Curation System

### Claude Code Setup
- **ui-ux-pro-max skill installed** — cloned `github.com/nextlevelbuilder/ui-ux-pro-max-skill` into `.claude/skills/ui-ux-pro-max/`. 39.6k star repo providing design intelligence for Claude Code UI work.
- **CLAUDE.md created** — ran `/init` in Claude Code to auto-generate project context file. Covers: commands, stack, path alias, DB conventions, API auth pattern, state management, pricing layers, CJ client, variant system, landing page gotchas, key types, reference doc pointers, Tailwind theme.
- **Brand section added to CLAUDE.md** — colors (navy #0f1629, gold #c8a45e, cream #f7f6f3), fonts (Playfair Display / DM Sans), tone (premium but approachable), avoid list (purple gradients, bubbly UI, default Tailwind blue).
- **UI skill referenced in CLAUDE.md** — every Claude Code UI session now auto-loads the skill without manual prompting.
- **Submodule fix** — git clone registered `.claude/skills/ui-ux-pro-max` as a submodule, breaking Netlify builds. Fixed with `git rm -r --cached .claude/skills/ui-ux-pro-max` + commit. Added `.claude/skills/` to `.gitignore`.

### Homepage Hero Redesign
Claude Code used the ui-ux-pro-max skill to redesign the hero section (`app/page.tsx` + `components/storefront/HeroGrid.tsx`):
- **Background** — cream → deep navy gradient with subtle gold radial glow
- **Headline** — "Moore Items. More **Savings.**" with "Savings." in gold-400, Playfair Display bold
- **Kicker** — "CURATED FOR YOU" in gold-500 with wide letter-spacing above headline
- **Social proof** — real filled gold star icons replacing Unicode characters
- **CTAs** — gold "Shop Best Sellers" primary + ghost "Browse All" secondary; no default Tailwind blue
- **Trust bar** — "Secure checkout · 30-day returns · Quality guaranteed" with shield icon
- **Mobile** — image grid shows first (order-1) on mobile so ad traffic sees products immediately
- **Asymmetric image grid** — 1 tall left panel (row-span-2) + 1 top-right + 2 small bottom-right; ring-1 border depth, bottom gradient overlay, product name hover reveal (slides up), scale-up hover (105%), 500ms fade
- **Stats bar** — compact navy-950 bar with gold dividers, icon + value/label side-by-side dashboard style

### Hero Image Curation System
Full system to hand-pick which products and images appear in the homepage hero grid, replacing the auto-tagged pool.

**Database** (`supabase/migrations/20260310_hero_images.sql` + `20260310b_hero_images_slots.sql`):
- `mi_hero_images` table: id, product_id (FK), image_url, product_name (denormalized), slot (1–4), is_active, created_at
- Slot constraint: CHECK (slot >= 1 AND slot <= 4)
- Index: `idx_hero_images_slot_active` on (slot, is_active, created_at)

**API Routes:**
- `GET /api/hero-images` — public, returns active images in slot/created_at order with product slugs joined
- `GET /api/admin/hero-images` — admin, returns all rows
- `POST /api/admin/hero-images` — add item with slot (1–4)
- `PATCH /api/admin/hero-images/[id]` — update is_active or slot
- `DELETE /api/admin/hero-images/[id]` — remove item

**Admin Page** (`app/admin/hero-images/page.tsx`):
- Two-column layout: 4 slot buckets (left) + live Homepage Preview panel (right, sticky)
- 4 buckets: "Slot 1 — Large Left", "Slot 2 — Top Right", "Slot 3 — Small Bottom Left", "Slot 4 — Small Bottom Right"
- Each bucket: thumbnail grid, per-image active toggle + delete on hover, "Add" button scoped to that slot
- Add modal: type-to-search products → click product → see all images in 3-col grid → click to add
- Preview panel: replicates exact asymmetric HeroGrid layout with navy background, first active image per slot, grey placeholders for empty slots, live useMemo updates on every change
- Active count badge in header, per-slot image counts
- "Hero Images" link added to admin sidebar under STORE section

**HeroGrid** (`components/storefront/HeroGrid.tsx`):
- Fetches from `/api/hero-images` on mount, groups by slot
- 4 independent setInterval timers (one per slot), staggered by 1s (slot 1: 0s, 2: 1s, 3: 2s, 4: 3s)
- Each slot cycles through its own pool in created_at order
- Falls back to auto-tagged pool per slot if no curated images for that slot
- Visual layout and animations unchanged

### Shipping Cost Data Fix
- Discovered 3 products had bad CJ freight quotes stored at import: pendant light ($38.59), two moissanite ring sets ($25.77, $17.07), pet cot ($13.69)
- `useCJFreightQuotes: true` in shipping_config means checkout reads `shipping_cost` directly from DB
- Fix: `UPDATE mi_products SET shipping_cost = 0 WHERE shipping_cost > 10 AND status = 'active'` — 3 rows zeroed out, now fall back to flat $4.99 rate
- Average shipping cost across 2,410 active products confirmed at $3.09 (healthy)

### Key Facts
- `.claude/skills/` must stay in `.gitignore` — it's a dev tool, not source code; git clone registers as submodule and breaks Netlify if tracked
- CLAUDE.md is read automatically by Claude Code on every session — keep it updated as the project evolves
- Hero slot 1 (Large Left) is the most prominent — use tall/portrait lifestyle images there
- Each hero slot rotates its own independent pool; staggered timers prevent all 4 slots swapping simultaneously
- `useCJFreightQuotes: true` means bad CJ quotes directly charge customers — check `shipping_cost > 10` after bulk imports

---

### Session 37 (Mar 12, 2026): GSC Cleanup, Daily AI Briefing System, Google Merchant Center

#### GSC Cleanup — All Issues Resolved
Full audit of Google Search Console indexing issues. Root cause: all phantom URLs traced to Shopify OAuth URLs (`/services/login_with_shop/authorize`) scraped onto the domain from external directories in Sep–Nov 2025. No code issues found.

**Fixes applied:**
- `app/robots.ts` — added `/services/` and `/lp/` to disallow array; replaced 2 hardcoded `https://mooreitems.com` sitemap URLs with `SITE_URL` constant from `lib/seo/constants`
- `app/sitemap.xml/route.ts` — replaced all 13 hardcoded `BASE_URL` references with `SITE_URL` constant from `lib/seo/constants` (only active products already filtered — no change needed there)
- Commits: `fix: robots.txt - disallow /services/ and /lp/, use SITE_URL constant`, `fix: use SITE_URL constant in sitemap and robots, filter active products only`

**GSC issue resolution:**
- 27 page redirects (www) → self-resolving via canonicals; DO NOT use GSC Removals tool (would remove non-www URLs too)
- 11 noindex → all phantom Shopify URLs, blocked by robots.txt fix
- 5 x 403 → phantom Shopify URLs, blocked by /services/ disallow
- 3 x 404 → out-of-stock products (not in sitemap, notFound() handles correctly)
- 1 x 5xx → phantom Shopify URL, blocked
- 9 canonical alternates → not an issue, Google correctly deferring

#### Daily AI Briefing System — Live
Built a daily AI-powered ops briefing system that replaces the noisy hourly stock sync emails with one intelligent morning summary.

**Architecture:** cron-job.org (7AM EST daily) → Netlify Background Function → Supabase data gather → Claude Haiku analysis → SendGrid email

**Files created:**
- `netlify/functions/daily-briefing-background.mts` — background function (returns 202 immediately, runs up to 15 min). Auth via `x-briefing-secret` header. Gathers: yesterday's sales + 7-day trend (mi_orders), catalog health (active/OOS/margin drift/24h stock changes), auto-import last run status (mi_settings key: `auto_import_last_run`), stuck unfulfilled paid orders >24h old. Calls Claude Haiku with ops manager system prompt. Sends navy/gold branded email via SendGrid.
- `lib/email/templates/daily-briefing.ts` — HTML email template, navy/gold styling, raw data footer

**Files modified:**
- `lib/email/sendgrid.ts` — added `sendDailyBriefing()` export
- `netlify/functions/stock-sync-background.mts` — email now only sends if totalChanges >= 10 OR any product went out_of_stock (was sending every hourly run)
- `app/api/auto-import/suggest/route.ts` — upserts `auto_import_last_run` timestamp to `mi_settings` after each successful run

**Auto-import status logic in briefing:**
- Key missing or null → "No run recorded yet" (informational, not flagged)
- Last run >25h ago → "ACTION REQUIRED: Last run was Xh ago (missed scheduled run)"
- Last run within 25h → "ALL CLEAR: Last run {timestamp}"

**cron-job.org config:**
- Title: MooreItems Daily Briefing
- URL: `https://mooreitems.com/.netlify/functions/daily-briefing-background`
- Method: POST
- Schedule: Daily 7:00 AM EST (America/New_York)
- Header: `x-briefing-secret: [BRIEFING_SECRET env var]`
- Timeout: 30s (returns 202 immediately — background function handles rest)

**New env var:** `BRIEFING_SECRET` — add to Netlify environment variables

**Key learnings:**
- Netlify Background Functions return 202 immediately — cron-job.org 30s timeout is not an issue
- Test orders (tibbyy05@gmail.com) show as stuck orders in briefing — filter these out or mark as fulfilled
- Sole proprietors have ONE EIN regardless of number of businesses — Ai-genda EIN is also valid for MooreItems

#### Google Merchant Center — Misrepresentation Issue
GMC flagged Misrepresentation on ~Mar 1 (coinciding with Session 14 SEO changes). All products blocked from US free listings.

**Status:** Identity verification submitted. Review requested (1 of 3 attempts used). Awaiting Google response (3-5 business days).

**What was done:**
- Identified as automated check (not human reviewer)
- Uploaded Ai-genda EIN document for identity verification (sole proprietors share one EIN across all businesses — IRS rule)
- Submitted review request with "My account meets the policy requirements" confirmed
- Returns page updated: "Contact support" → links to /contact page (no email exposed publicly)
- Namecheap email forwarding set up: `support@`, `orders@`, `hello@` → all forward to mooreitemsshop@gmail.com

**Key facts learned:**
- IRS online EIN tool: sole proprietors can only have ONE EIN regardless of number of businesses
- Ai-genda EIN is legally valid for MooreItems — no separate EIN needed or possible
- IRS online application: one per SSN per day limit; if blocked, try next day
- Namecheap email forwarding is free — use REDIRECT EMAIL section (not REDIRECT DOMAIN)
- GMC review limit: 3 attempts; if all fail must wait before trying again
- GMC chart showed products approved Feb 13–Mar 1, then flipped to Not Approved — triggered by Session 14 SEO changes (metadataBase set to www.mooreitems.com)

**Site trust signal checklist confirmed before review:**
- ✅ About page — describes business, mission, values
- ✅ Returns page — 30-day policy, links to /contact for initiation
- ✅ Shipping Policy — linked in footer
- ✅ Contact page — form working, forwards to Gmail
- ✅ Footer — all policy links visible (Shipping Policy, Returns & Refunds, FAQ, About Us, Privacy Policy, Terms of Service, Contact Us)
- ✅ SSL — Netlify automatic (Chrome removed padlock icon in 2023, now shows tune/sliders icon)
- ✅ Payment icons — Visa, Mastercard, Amex, Discover, Apple Pay, Google Pay in footer

#### Session 38 — CN Import Pipeline Debug (March 12-13, 2026)

**Goal:** Fix `stock_count` (showing 100 instead of real CN numbers) and `sku` (null instead of CJ variantSku) on CN warehouse product imports. Test product: 350ML Electric Juicer Blender (CJ PID: `1392009095543918592`).

**Fixes confirmed working:**
- Delivery time display updated to "8-15 business days" for CN products (3 locations: ProductPageClient.tsx, ProductCard.tsx)
- Variant color/size parser fixed for space-separated keys ("Blue 380ml" → color=Blue, size=380ml)
- CJVariant interface updated with `variantSku`, `variantKey`, `variantWeight` fields
- `check-cj-product.js` diagnostic script upgraded: reads PID from argv, shows full variant table, dumps raw first variant object, shows full variantInventories breakdown
- CN stock update error logging added (was silent catch block)
- Stock field name fixed: `totalInventoryNum` (product-level) vs `totalInventory` (variant-level, no "Num")
- `product_id` constraint removed from CN stock update — matches only on `cj_vid` (globally unique)
- Freight API call removed from import route entirely — replaced with weight-based estimate (`weightG > 2000 ? 8 : weightG > 500 ? 5 : 3`). Freight was causing Netlify timeout (~29s) because 3 CJ API calls × 3s rate limit gaps exceeded the 26s function limit. Route now makes only 2 CJ calls (getProduct + getProductStock).

**Root cause of timeout identified:**
The import route was making 3 CJ API calls (getProduct, getProductStock, freightCalculate), each separated by a 3-second rate limiter, plus API latency. This pushed total runtime to ~29s, exceeding Netlify's 26s function limit. The function was killed before reaching the variant upsert and CN stock update blocks, so those never ran. Product inserted with DB defaults (stock_count=100 from the variant upsert hardcoded value, not the DB column default which is 0).

**Still broken after session (unresolved):**
- `stock_count` still writes as 100 on all variants despite code saying `stock_count: 0`
- `sku` still null despite `variant.variantSku` confirmed present in API response
- After removing freight call and clearing Netlify cache, variants are created in ~400ms bursts (created_at = updated_at, meaning the CN stock update block never fires and the upsert is somehow writing 100 not 0)
- No Netlify logs appear after the import completes — the route appears to be silently crashing after variant insert, before the CN stock update runs

**What was ruled out:**
- DB trigger overriding values — only trigger is `update_updated_at_column()` (UPDATE only, harmless)
- `cj_vid` unique constraint missing — confirmed `mi_product_variants_cj_vid_key` exists
- Wrong route being called — confirmed `admin/catalog/import` → `import-cj/route.ts`
- Stale Netlify cache — full cache clear and redeploy performed, same result
- DB column default — `stock_count` column default is 0, not 100
- Git not committed — confirmed correct SHA deployed matches committed code

**Current theory for fresh investigation:**
The upsert `onConflict: 'cj_vid'` may not be overriding `stock_count` when the row already exists from a partial previous run, OR the route is still crashing before the CN stock update block runs for an unknown reason. The `updated_at = created_at` on every row confirms the UPDATE-triggered timestamp never fires, meaning either: (a) the CN stock update block never executes, or (b) it executes but Supabase RLS silently blocks it.

**Key diagnostic data:**
- All 10 blender variants confirmed in CJ API with real stock (7,016–41,305 units)
- `variantSku` IS present on variant objects from `getProduct()` endpoint (confirmed via raw dump)
- `variantInventories[].inventory[].totalInventory` is the correct field for variant-level stock (no "Num" suffix)
- Stock sync route (`/api/admin/catalog/stock-sync`) is a proxy to Netlify Background Function — cannot be called inline from import

#### Session 39 — CN Import Pipeline Completed + Admin Product Editor Fixes (March 13, 2026)

**Goal:** Complete the CN import pipeline (per-variant stock + shipping), fix the product edit page save bug, fix variant pricing, and improve the variant manager UI.

---

**CN Import Pipeline — Fully Resolved ✅**

All issues from Session 38 are now fixed and production-verified.

**Root causes found and fixed:**
1. `stock_count: 100` — import route was using `getInventoryByPid` (product-level total only). Fixed: added `getVariantStock(vid)` method in `lib/cj/client.ts` calling `/product/stock/queryByVid?vid=${vid}` with `skipRateLimit: true`. Sequential calls with 1000ms delay between variants.
2. `sku: null` — `sku` field was missing from variant upsert payload entirely. Fixed: added `sku: v.variantSku` to upsert.
3. `stock_count` still 100 after fix — CJ `queryByVid` requires 1 req/sec. Parallel calls fail; batches of 3 fail; sequential with 300ms fail; sequential with 1000ms = 10/10 success.
4. Background function not running as background — `export const config = { path: '...' }` at bottom of `netlify/functions/import-product-background.mts` was overriding path registration, stripping background execution mode. Removed config export — `-background` filename suffix alone tells Netlify to use 15-minute timeout. `stock-sync-background.mts` never had this config and worked fine.
5. Single freight call for all variants — added per-variant `calculateFreight` calls inside variant loop. Each variant gets its own cheapest non-zero quote. Falls back to product-level freight if individual call fails.

**Verified result (blender CJ PID: `1392009095543918592`):**
- White: stock 40,000, shipping $17.32, retail $60.99
- Black: stock 7,016, shipping $11.04, retail $80.99
- Blue 380ml: stock 11,195, shipping $9.30, retail $22.99
- Pink/2pcs: stock 38,334, shipping $22.85, retail $96.99
- All 10 variants: real per-variant stock ✅, real per-variant shipping ✅, correct SKUs ✅

**Key files changed:**
- `netlify/functions/import-product-background.mts` — all import logic, per-variant stock + freight, config export removed
- `app/api/admin/scout/import/route.ts` — thin gateway: auth check, duplicate check, fires background function, returns 202
- `lib/cj/client.ts` — added `getVariantStock(vid, signal?)` method

---

**Variant Manager UI — Improved ✅**

New columns and features added to `app/admin/products/edit/[id]/page.tsx`:
- **Total Cost column** — `cj_price + shipping_cost`, bold
- **Margin column** — `((retail - cost - shipping) / retail * 100)%`, colored green ≥30%, amber 15-30%, red <15%
- **Sale Price moved** to end of row
- **Sortable columns** — Name, Stock, Total Cost, Sale Price, Margin
- **Bulk select + delete** — checkboxes per row + select-all, red "Delete X selected" confirmation button
- **Hide/Show toggle** — eye icon toggles `is_active` via PATCH; inactive rows show faded/strikethrough
- **Margin warning banner** — yellow alert listing variants below 25% margin threshold
- `app/api/admin/variants/[id]/route.ts` — added `is_active` to PATCH handler whitelist

---

**Product Edit Save Bug — Fixed ✅**

The product PATCH handler was silently returning 500 with no logs. Root cause chain:
1. `requireAdmin()` was outside try/catch — any auth error silently killed the request
2. After wrapping everything in try/catch, revealed real error: `PGRST204 — Could not find the 'processing_time' column`
3. Fix: added missing columns to `mi_products` via SQL:
   ```sql
   ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS processing_time text;
   ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS shipping_days text;
   ```

**Bulk variant price overwrite bug — Fixed ✅**

Every product save was overwriting ALL variant `retail_price` values with the product-level price. Found in `app/api/admin/products/route.ts` lines 232-237:
```ts
// Sync retail_price to all variants for this product
if (updates.retail_price || updates.markup_multiplier) {
  await supabase.from('mi_product_variants').update({ retail_price: data.retail_price }).eq('product_id', id);
}
```
Removed entirely. Variant prices are now managed individually via the variant PATCH endpoint.

---

**Storefront Product Page Fixes ✅**

- **Shipping days** — product page was hardcoding "2-5 business days" / "8-15 business days" based on warehouse. Now reads `product.shippingDays` dynamically. Fixed in badge and accordion sections.
- **Shipping days priority** — `lib/seo/fetchers.ts` was checking `shipping_estimate` before `shipping_days`. Flipped priority: `shipping_days || shipping_estimate || '7-12 days'` (two locations: lines 363 and 415).
- **Warehouse badge text** — "Ships from United States" was hardcoded for all US warehouse products. Now reads from `product.warehouse === 'CN'` to show correct text.
- **Variant parser fix** — `lib/utils/variant-parser.ts`: "Blue 380ml" was incorrectly parsed as `color=Blue, size=380ml`. Now single-concept names (no " / " separator) are treated as full color name, `size=null`. Only " / " separated names split into color + size.
- **Variant pricing** — storefront now uses selected variant's `retail_price` as source of truth for displayed price, discount badge, and cart payload. Product-level `retail_price` is only the default "from" price before variant selection. Fixed in `app/product/[slug]/ProductPageClient.tsx`.
- **Editable shipping info** — new Shipping Info card on product edit page with `shipping_days` and `processing_time` text inputs.

---

**Key Learnings This Session**
- Netlify background functions: `export const config = { path: '...' }` strips background execution mode. Use filename `-background` suffix only — no config export needed.
- CJ `queryByVid` rate limit is strict 1 req/sec — use 1000ms delays, not 300ms.
- Never put bulk variant updates in the product PATCH handler — variants have independent pricing.
- Always check `updated_at` timestamps in DB to identify what's overwriting data.
- `PGRST204` Supabase error = column doesn't exist in schema cache (run migration first).

---

#### Session 40 — Variant Image Editor + Direct Browser Upload (March 13, 2026)

**Goal:** Add variant image drag-and-drop upload to admin product edit page, then move all image uploads to direct browser-to-Supabase Storage to bypass Netlify's 6MB function body limit.

---

**Variant Image Editor — Built ✅**

Added per-variant image upload zones to `app/admin/products/edit/[id]/page.tsx`:
- Drag-and-drop upload zones per variant row
- Uploads to `gallery-photos` Supabase Storage bucket at path `variants/${variantId}/${uuid}-${filename}`
- PATCH API route at `app/api/admin/products/[id]/variant-image/route.ts` updates `mi_product_variants.image_url`
- File type validation (JPEG, PNG, WebP, GIF) and 20MB client-side size check

---

**Direct Browser Upload — Migrated ✅**

Both the main product Images section and variant image uploads now upload directly from the browser to Supabase Storage using `@supabase/ssr` `createBrowserClient`, bypassing the API routes entirely. This avoids Netlify's hard 6MB serverless function body limit.

- **Main product images** → `landing-page-images` bucket at `products/${productId}/${uuid}-${filename}`
- **Variant images** → `gallery-photos` bucket at `variants/${variantId}/${uuid}-${filename}`
- Removed POST to `/api/admin/landing-pages/upload-image` and `/api/admin/products/upload-image` from this page
- `landing-page-images` bucket limit raised to 25MB in Supabase dashboard

---

**Key Learnings This Session**
- Netlify serverless functions have a hard 6MB request body limit — large file uploads must go directly from the browser to Supabase Storage using the client-side SDK, not through an API route.

---

#### Session 41 — Media Gallery Overhaul + Products List Improvements (March 14, 2026)

**Goal:** Rebuild the admin product edit media gallery with native drag-and-drop and Cloudflare Stream direct upload; improve storefront image gallery; overhaul the products list page with filters and better layout.

---

**Unified Media Gallery — Rebuilt ✅**

Completely rebuilt the media gallery in `app/admin/products/edit/[id]/page.tsx`:
- Replaced `@hello-pangea/dnd` library with native HTML5 Drag and Drop API (draggable, onDragStart, onDragOver, onDrop, onDragEnd)
- Unified images and videos into a single `MediaItem` discriminated union type (`type: 'image' | 'video'`)
- Layout: responsive wrapping grid (`grid grid-cols-5 gap-3`) with 240×240px square cards
- Drag visual feedback: `dragOverIdx` state drives gold ring on drop target (`ring-2 ring-[#c8a45e] scale-105 brightness-110`), opacity-40/scale-95 on dragged item, opacity-70 on others
- Image lightbox via portal (Escape key, bg-black/80, 90vw×90vh)
- Video preview modal with 16:9 Cloudflare iframe
- Hero badge sorted correctly on reload (items sorted by `sort_order` on load)
- "View on Storefront" button with ExternalLink icon
- Form container widened to `max-w-7xl`

---

**Cloudflare Stream Direct Upload — Built ✅**

Rewrote `app/api/admin/products/upload-video/route.ts`:
- API now accepts JSON `{ productId, fileName, fileSize }` instead of FormData with file
- Calls Cloudflare `direct_upload` endpoint to get one-time `uploadURL` + `uid`
- Saves pending video entry to `mi_products.videos` with `status: "processing"`
- Returns `{ success, uploadURL, videoId }` to client
- Browser uploads directly to Cloudflare via XHR with progress tracking (`xhr.upload.onprogress`)
- Eliminates Netlify's 6MB serverless function body limit for video files

---

**Storefront Image Gallery Fixes ✅**

`components/storefront/ImageGallery.tsx`:
- Single `aspect-square` container wrapping both image and video — prevents layout jumps when switching
- `object-cover` on main image (was `object-contain`)
- `object-cover` on all thumbnails (was `object-contain`)
- Video iframe: `w-full h-full` with params `?autoplay=true&muted=true&loop=true&controls=true`

`app/product/[slug]/ProductPageClient.tsx`:
- Gallery only includes variant images from **active** variants (`variant.is_active === true`)

---

**Products List Page Improvements ✅**

`app/admin/products/page.tsx`:
- Default status filter changed from "all" to "active"
- Source filter dropdown (CJ / AliExpress / Digital / Manual) — server-side filtering
- Price min/max inputs (client-side filter on `retail_price`)
- Larger thumbnails: `w-14 h-14` (was `w-11 h-11`)
- Removed Shipping column to save horizontal space
- Reduced cell padding: `px-2` (was `px-4`)
- Product name truncation: `max-w-[200px]` with `truncate`

`app/api/admin/products/route.ts`:
- Added `source` query param with server-side filtering:
  - `cj` → `supplier = 'cj'`
  - `aliexpress` → `supplier = 'aliexpress'`
  - `digital` → `warehouse = 'DIGITAL'`
  - `manual` → `supplier = 'manual' AND warehouse != 'DIGITAL'`

---

**Key Learnings This Session**
- CJ shipping cost is per-product, stored in `mi_products.shipping_cost` — not a flat rate. Each product's margin calculation must use its own shipping cost.
- CJ stock response structure: `data[0].variants[].variantInventories[]` — must drill into `variantInventories` array for per-variant stock counts.
- Git submodules (like `.claude/skills/`) are separate repos — changes inside them don't appear in the parent repo's `git status`.
- Cloudflare Stream direct upload flow: API gets one-time `uploadURL` via `direct_upload` endpoint → browser POSTs file directly to Cloudflare → no serverless function size limits.
- Cloudflare Stream video format: iframe src should include `?autoplay=true&muted=true&loop=true&controls=true` for proper playback.
- Source filter DB values: CJ products have `supplier = 'cj'`, AliExpress have `supplier = 'aliexpress'` (lowercase, exact match). Digital products identified by `warehouse = 'DIGITAL'`. Manual products: `supplier = 'manual' AND warehouse != 'DIGITAL'`.
- The `ui-ux-pro-max` skill at `.claude/skills/ui-ux-pro-max/src/ui-ux-pro-max/SKILL.md` should be read before any frontend/component work per CLAUDE.md instructions.
- Native HTML5 Drag and Drop API is simpler and more reliable than library solutions (`@hello-pangea/dnd`) for basic reordering — avoids React version conflicts and dependency bloat.

---

#### Session 42 — AI Product Enrichment System (March 14, 2026)

**Recently Completed:**

- ✅ AI Improve feature built on admin product edit page — `app/api/admin/ai-enrich-product/route.ts` fetches product from Supabase + CJ API data, calls Claude Haiku (4000 max_tokens), returns enriched fields
- ✅ Enrichment touches: title, description (rich HTML), whats_included, meta_title, meta_description, alt_texts only — never pricing, images, variants, stock, shipping
- ✅ Side drawer UI on edit page with per-field accept/reject toggles, Apply Accepted button, field count
- ✅ RichTextEditor component (`components/admin/RichTextEditor.tsx`) — Tiptap with Bold, Italic, Underline, Bullet List, H2, H3, Link; navy toolbar, gold active state; `immediatelyRender: false` for SSR
- ✅ SEO section added to product edit page — meta_title (60 char) and meta_description (155 char) with live character counters; both save to existing `mi_products` columns
- ✅ `@tailwindcss/typography` installed and added to `tailwind.config.ts` — was missing, causing all rich HTML descriptions to render as unstyled plain text
- ✅ `extractSpecs()` in `ProductPageClient.tsx` updated to only match "Label: Value" or "Label — Value" formatted lines (max 80 chars) — prevents AI prose from triggering false spec section
- ✅ AI enrichment system prompt includes: Moore Items brand voice, source-of-truth priority (current product data overrides CJ), keyword-first title/meta rules, natural connector-word titles, "Perfect For Making" use case section with 4–6 bullets per product

**Known Pending Items:**

- Bulk AI enrichment job — run all products through ai-enrich pipeline overnight in batches (Background Function); ~3,000+ products need enrichment
- alt_texts from AI enrichment not yet persisted to DB — future task once image alt text field exists

**Key Learnings This Session**

- `cleanDescriptionHtml` was already preserving formatting tags — the issue was missing `@tailwindcss/typography` plugin, not the sanitizer
- CJ product data uses `cj_pid` column (not `cj_product_id`) and `name` column (not `title`) in `mi_products`
- Next.js 404s on API routes can indicate a silent compile/runtime error inside the route file — check dev server terminal, not just the browser console
- Tiptap SSR error fixed with `immediatelyRender: false` in `useEditor` config
- AI enrichment prompt should teach Claude how to reason about keywords, never hardcode product-specific terms

---

#### Session 43 — Catalog Health Cleanup & Auto-Reprice (March 15, 2026)

**Recently Completed:**

- ✅ 10 missing-category products (null `category_id`) AI-categorized using `scripts/ai-categorize-remaining.js` — Storage & Organization (2), Home & Furniture (3), Garden & Outdoor (2), Tools & Hardware (2), Kitchen & Dining (1)
- ✅ 2 placeholder-price products hidden: "Gray Hardtop Gazebo with Steel Roof and Curtains" (set `status: 'hidden'`), "Red Faux Leather 3-Piece Sofa Set" (already hidden)
- ✅ 24 price-drift-flagged products manually repriced using `CEIL((new_cj_price + COALESCE(shipping_cost, 3.00)) * 2.0) - 0.01` formula — updated `cj_price`, `retail_price`, cleared `price_drift_flagged`
- ✅ Category `product_count` refreshed across all 13 categories — old counts were stale (included non-active products), now reflect only `status=active`
- ✅ Daily briefing stuck order query fixed (`netlify/functions/daily-briefing-background.mts`): `fulfillment_status` value corrected from `'unfulfilled'` → `'pending'`, time window changed from 24 hours → 3 days
- ✅ Confirmed 0 actual orphaned products (products with `category_id` pointing to nonexistent category) — health check orphan detection may be a false positive; needs audit
- ✅ Auto-reprice logic added to stock sync (`netlify/functions/stock-sync-background.mts`): drift <25% auto-applies `CEIL((new_cj_price + shipping) * 2.0) - 0.01` and updates `cj_price`, `retail_price`, clears flag; drift >=25% flags for manual review with `recommendedPrice` stored in `price_drift_details`

**Infrastructure Patterns Established:**

- Stock sync auto-reprice: CJ cost drift <25% is auto-corrected during hourly stock sync using `CEIL((new_cj_price + COALESCE(shipping_cost, 3.00)) * 2.0) - 0.01`; drift >=25% is flagged with `recommendedPrice` in `price_drift_details` for manual review via admin health check

**Key Learnings This Session**

- `mi_products` uses `status` column (`'active'`, `'hidden'`, `'pending'`, `'out_of_stock'`) — there is no `is_active` boolean column
- `mi_orders` has no generic `status` column — use `payment_status` (e.g., `'paid'`) and `fulfillment_status` (e.g., `'pending'`, `'fulfilled'`) separately
- `scripts/fix-prices.js` uses hardcoded 2.0× markup from static `PRICING_CONFIG`, not the DB pricing config (which has 1.6× US / 1.8× CN) — do not run for targeted repricing; use the drift reprice formula directly
- Health check "price drift" is about CJ supplier cost changes (variant `cj_price` vs current CJ API price), not markup formula drift — the 975 "drifted" products from comparing against DB config multipliers were false positives

---

#### Session 44 — Mobile UX Overhaul + Pipeline Hardening + Featured Product (March 15, 2026)

**Mobile UX Overhaul (2 critical, 12 medium, 6 low fixes):**

- ✅ Root-level horizontal overflow fixed — html/body overflow-x-hidden + 3 source causes: AnnouncementBar ticker, Header sticky positioning, Best Sellers carousel
- ✅ Product page: image constrained to h-[40vh], overflow-x-hidden on main + content container, min-w-0 on gallery flex children
- ✅ Header: cart icon always visible (flex-shrink-0), search bar max-w-[160px] cap on mobile
- ✅ QuickViewModal: image constrained to max-h-[45vh] on mobile
- ✅ ShoppingAssistant FAB: moved to bottom-24 on mobile, z-30 to avoid sticky bar overlap
- ✅ Email popup: centered with mx-4, max-w-md on mobile
- ✅ All touch targets increased to 44px minimum (hamburger, cart drawer close, cart remove, back button)
- ✅ Safe-area padding added to mobile menu for notched phones (env(safe-area-inset-bottom))
- ✅ View All buttons visible on mobile, swipe hint added to carousels ("Swipe to see more →")
- ✅ Order confirmation: flex-wrap on item rows for narrow screens
- ✅ Breadcrumb href fixed from "\" to "/"

**Shipping Times Fixed Everywhere:**

- ✅ Product cards (both ProductCard files): now read warehouse field dynamically instead of hardcoded strings
- ✅ Cart summary: warehouse detection fixed to use `warehouse` field (not `warehouse_status`) with dynamic US/CN/mixed/digital banners
- ✅ Order confirmation page: dynamic delivery estimate from shipping_days → warehouse fallback
- ✅ Order emails: dynamic delivery estimate matching product shipping_days
- ✅ Featured product section: delivery badge removed (not a selling point for featured spotlight)

**Availability Pipeline Hardened:**

- ✅ Checkout layer 2: removed stale product-level stock_count check, added variant `is_active` check
- ✅ Checkout layer 3: CJ API errors now cross-check DB stock before blocking — DB is source of truth
- ✅ Stock sync: product-level stock_count updated from variant totals after each batch
- ✅ Stock sync: structured error logging for persistent CJ API failures
- ✅ Webhook reconcileProductStatus: `is_active` toggled in sync with stock_count
- ✅ CJ API confirmed: returns 200 for live products even when website/API desync occurs

**Order Pipeline Fixed:**

- ✅ Variant required: first available variant auto-selected on page load
- ✅ Variant required: inline error blocks add-to-cart if no variant selected
- ✅ Variant required: server-side guard in checkout rejects orders without variant_id
- ✅ `variant_info` now written to mi_order_items at checkout (color · size)
- ✅ Order email race condition: 3-attempt retry loop with 2s delays (was returning empty data)
- ✅ Order email variable shadowing bug fixed (typeof rawItems pattern replaced with explicit type)
- ✅ Order email: dynamic delivery estimate using shipping_days from mi_products
- ✅ Order confirmation page: shows variant color/size, dynamic delivery estimate
- ✅ Fulfillment race condition: same retry loop added to fulfill-order.ts
- ✅ Silent fulfillment failures: fulfillment_status now set to 'failed' (not just logged)
- ✅ Admin orders: Failed tab added with red badge, retry fulfillment button
- ✅ Stripe test mode: CJ fulfillment and emails skipped when event.livemode === false
- ✅ CJ shipping method: 'CJPacket' → 'CJPacket Ordinary' for CN warehouse orders
- ✅ CJ default shipping rule configured in CJ dashboard (Cost Priority, CJPacket Ordinary)

**Featured Product Section (NEW):**

- ✅ `components/storefront/FeaturedProduct.tsx` — full-width navy (#0f1629) section on homepage below hero
- ✅ Two-column layout: left = large product image, right = gold label, Playfair heading, star rating, price with savings badge, benefit bullets (HTML-stripped from description), urgency signal, Shop Now + Add to Cart CTAs
- ✅ `app/api/featured-product/route.ts` — public GET with 5-min revalidation cache
- ✅ `app/api/admin/featured-product/route.ts` — GET/POST/DELETE with requireAdmin() guard
- ✅ `app/admin/featured-product/page.tsx` — admin picker with current product display, live search, click-to-select, remove button, toast feedback
- ✅ Stored in mi_settings key: `featured_product_id` (value: `{ id: uuid }`)
- ✅ Featured Product link added to admin sidebar under STORE section (Crown icon)
- ✅ Component returns null when no featured product set (renders nothing)

**Hero Rotation:**

- ✅ HeroGrid.tsx interval: 4000ms → 12000ms (12 seconds)
- ✅ HeroSlider.tsx interval: 6000ms → 12000ms (12 seconds)

**Digital Downloads:**

- ✅ Category image added: `public/images/categories/digital-downloads.jpg`

**Featured Product Fixes (continued):**

- ✅ Search param bug fixed: component was sending `?search=` but `/api/products` uses `?q=` — aligned to `?q=`
- ✅ RLS policy added to mi_settings for admin writes (`CREATE POLICY "Admin can manage settings"`)
- ✅ `variant_info` column was missing from live `mi_order_items` table — fixed with `ALTER TABLE mi_order_items ADD COLUMN variant_info text NULL`. This was root cause of "Unable to create order items" checkout error

**Free Shipping Threshold ($50+):**

- ✅ Checkout route (`app/api/checkout/route.ts`): `if (subtotal >= 50) totalShipping = 0` applied after per-product shipping_cost sum — works for ALL orders including CN warehouse
- ✅ CN free shipping label: shows "Free International Shipping" (with 7-15 day estimate) when threshold met
- ✅ Cart summary (`components/cart/CartSummary.tsx`): shows "FREE" in green when subtotal >= $50, shows "Add $X.XX more for free shipping" muted hint when under $50

**Blender Variant Cleanup:**

- ✅ White Pink (bundle), 2pcs White, 2pcs Pink, Pink/White Simple Packaging, Blue 380ml, Blue 420ml variants deactivated via admin
- ✅ Only White, Pink, Black single-unit variants remain active

**GA4 Live Visitors Fixed:**

- ✅ Root cause: missing `export const dynamic = 'force-dynamic'` on realtime-visitors route — Next.js tried static rendering, silently failing before GA4 call
- ✅ Added response body logging (`console.log('[GA4] status:', res.status)` + first 500 chars of body) for debugging
- ✅ Fixed JSON.parse issue: Supabase jsonb returns objects not strings — added `typeof setting!.value === 'string'` guard
- ✅ Catch block now logs actual error message to Netlify function logs (was swallowing silently)
- ✅ Returns `debug` field alongside `activeUsers: 0` on error so client can distinguish real zero from broken

**Visitor Stats Dashboard (NEW):**

- ✅ New API route: `app/api/admin/visitors/route.ts` — parallel calls to GA4 Realtime (activeNow) + GA4 runReport (30-day history with date dimension)
- ✅ Single date range approach (30daysAgo → today) — multiple dateRanges caused GA4 to add dateRange dimension, breaking count logic
- ✅ Returns: `activeNow`, `todayCount`, `weekCount`, `monthCount`, `dailyData` (last 7 days for chart)
- ✅ Admin dashboard updated: 4 visitor stat cards in grid-cols-4 (Live Now with green pulse, Today, This Week, This Month)
- ✅ Gold bar chart (recharts, #c8a45e, 120px height) showing last 7 days of visitor data
- ✅ Polls every 60 seconds (same pattern as previous live counter)
- ✅ Confirmed working: 1 live, 29 this week, 98 this month, chart showing Mar 10-15 upward trend
- ✅ Main stat cards moved to 6-column grid below visitors section

**CJ Shipping Configuration:**

- ✅ CJ default shipping rule configured in CJ dashboard: Cost Priority, CJPacket Ordinary for US-bound CN orders — future orders auto-assign without manual selection

**Key Learnings This Session:**

- CJPacket Ordinary is the correct CN→US shipping method (not plain CJPacket) — configured as CJ dashboard default rule
- DB is the source of truth for stock, not CJ API — CJ returns 200 for live products even during desync
- Order emails need retry loops because Supabase writes from Stripe webhook may not be immediately consistent
- `warehouse_status` and `warehouse` are different fields — cart/shipping logic should use `warehouse` (the actual product field), not `warehouse_status` (a derived display field)
- `variant_info` (and any new DB columns added in code) must be manually added to live Supabase with `ALTER TABLE` before deploying — code and DB schema can get out of sync silently causing insert failures
- GA4 API routes must have `export const dynamic = 'force-dynamic'` or Next.js static rendering will silently fail them
- GA4 `runReport` with multiple `dateRanges` adds a `dateRange` dimension to each row — use single date range and compute counts from date strings instead
- `mi_settings` RLS blocks writes by default — admin policies must be explicitly created for new write operations (e.g., featured_product_id upsert)
- Free shipping threshold must be enforced in checkout route, not just in UI — per-product `shipping_cost` DB values are the actual source used by Stripe, not the `lib/shipping.ts` config
