# MooreItems Site Audit Results

**Date:** February 25, 2026
**Site:** https://www.mooreitems.com

---

## CRITICAL Issues (Fix Immediately)

### 1. `/api/admin/resync` has NO authentication
**File:** `app/api/admin/resync/route.ts`
Any unauthenticated user can call this endpoint to **delete ALL products and variants** from the database and re-sync from CJ. No user check, no admin check — completely unprotected.
**Fix:** Add the same `requireAdmin()` pattern used in other admin routes.

### 2. `/api/admin/check-us-stock` has insufficient auth
**File:** `app/api/admin/check-us-stock/route.ts`
Both POST and PATCH only check if a user is logged in, but do NOT verify admin role. Any regular customer can view stock data and modify warehouse/shipping settings.
**Fix:** Add `mi_admin_profiles` admin role check.

### 3. `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in `.env.local`
The site URL env var points to localhost. This is used in the checkout route for Stripe success/cancel redirect URLs. If deployed with this value, paying customers get redirected to localhost after checkout.
**Fix:** Set to `https://www.mooreitems.com` in production environment.

### 4. Stripe keys are in test mode
`.env.local` contains `sk_test_` and `pk_test_` Stripe keys. No real payments can be processed. Production requires `sk_live_` and `pk_live_` keys.

---

## HIGH Issues (Fix Soon)

### 5. Localhost fallback in checkout route
**File:** `app/api/checkout/route.ts:230`
```ts
process.env.NEXT_PUBLIC_SITE_URL || request.headers.get('origin') || 'http://localhost:3000'
```
If env var is unset and origin header is missing, Stripe redirects to localhost.

### 6. No rate limiting on public `/api/assistant` endpoint
**File:** `app/api/assistant/route.ts`
Calls Anthropic API with no rate limiting. A bad actor could rack up significant API costs by repeatedly hitting this endpoint.

### 7. `/shop` page returns 404 on live site
The primary shop page appears to 404 on the live deployment. This is linked from the main navigation on every page and from the cart's "Continue Shopping" button. **Note:** This may be a stale deployment — verify by redeploying and testing in a browser, as the `app/shop/page.tsx` file exists in the codebase.

### 8. Eight API routes missing try/catch wrappers
These routes can produce unhandled 500 errors if `createServerSupabaseClient()` or other calls throw:
- `app/api/products/route.ts`
- `app/api/products/[slug]/route.ts`
- `app/api/categories/route.ts`
- `app/api/search/route.ts`
- `app/api/reviews/[productId]/route.ts`
- `app/api/admin/sync-shipping/route.ts`
- `app/api/admin/sync-reviews/route.ts`
- `app/api/admin/reprice/route.ts`

---

## MEDIUM Issues

### 9. Debug `console.log` in client-side product page
**File:** `app/product/[slug]/page.tsx:283`
```ts
console.log('[product images]', uniqueImages)
```
Leaks internal data to browser console on every product page visit. Remove.

### 10. Bare `console.error` in cart checkout
**File:** `app/cart/page.tsx:144`
```ts
console.error(error)
```
No context message — makes production debugging difficult.

### 11. Full Stripe session object exposed
**File:** `app/api/orders/[sessionId]/route.ts:118-122`
Returns the entire Stripe session object in the API response. The session ID is visible in the URL on the confirmation page, so any user with the URL can access potentially sensitive Stripe metadata.

### 12. No input length validation on search queries
**Files:** `app/api/search/route.ts:17`, `app/api/products/route.ts:39`
Search strings are passed directly into `ilike` queries with no length limit. Extremely long strings could cause performance issues.

---

## LOW Issues

### 13. Two TODO comments for stock imagery
- `components/storefront/HeroSlider.tsx:82` — `TODO: Replace with custom hero imagery` (uses Unsplash photos)
- `components/storefront/CategoryGrid.tsx:101` — `TODO: Replace with custom lifestyle images`

### 14. Dead code files (never imported anywhere)
**Unused components:**
- `components/sections/HeroSlider.tsx`
- `components/sections/NewsletterSignup.tsx`
- `components/sections/TrustBar.tsx`
- `components/sections/CategoryGrid.tsx`
- `components/sections/FlashDeals.tsx`
- `components/storefront/HeroSlider.tsx`
- `components/storefront/CategoryGrid.tsx`
- `components/storefront/TrendingCarousel.tsx`

**Unused data files:**
- `lib/admin-mock-data.ts` — fake orders/customers with `@example.com` emails
- `lib/mock-data.ts` — mock categories and products

### 15. Hardcoded business constants duplicated
`markup_multiplier: 2.0` and `stock_count: 100` are hardcoded in `app/api/admin/products/import-cj/route.ts` and `app/api/admin/sync-us-products/route.ts` instead of using the shared `PRICING_CONFIG`.

### 16. Extensive debug logging in CJ sync modules
`lib/cj/sync.ts`, `lib/cj/client.ts`, `lib/cj/reviews.ts` — heavy `console.log` statements throughout. Low risk since these are server-side admin operations.

---

## What's Working Well

- **Homepage** renders correctly with all sections populated (hero, best sellers, new arrivals, deals)
- **robots.txt** properly configured — blocks `/admin`, `/api`, `/auth`, `/account`
- **sitemap.xml** returns valid XML with static pages, 13 category URLs, and 600+ product URLs with `lastModified` dates
- **Public API endpoints** all respond correctly: `/api/products`, `/api/categories`, `/api/products?limit=1` return well-formed JSON
- **No hardcoded API keys** in source code — all secrets read from `process.env`
- **All 12 category images** exist on disk at `public/images/categories/`
- **No placeholder or lorem ipsum text** in live pages
- **No broken images** on pages that render content
- **Cart page** functions correctly in empty state
- **Meta tags** are appropriate (title, description, OG images)

---

## Recommended Fix Priority

1. Add auth to `/api/admin/resync` (5 min fix, critical security hole)
2. Add admin check to `/api/admin/check-us-stock` (5 min fix)
3. Set `NEXT_PUBLIC_SITE_URL` to production URL in deployment env
4. Switch Stripe keys to live mode when ready for real payments
5. Remove `console.log` from product page
6. Add rate limiting to `/api/assistant`
7. Wrap 8 API routes in try/catch
8. Redeploy and verify `/shop` page loads correctly
9. Clean up dead code files when convenient
