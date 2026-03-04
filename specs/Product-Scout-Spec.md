# Product Scout — Admin Feature Spec

**Feature:** Product Scout — CJ Dropshipping Product Research & Import Tool
**Location:** `/admin/scout`
**Admin Sidebar:** Under TOOLS group (alongside US Stock)
**Priority:** HIGH — required before Meta ad campaigns launch
**Purpose:** Give Danny full visual access to CJ's entire US warehouse catalog (including products not visible on CJ's public website), with margin calculations, catalog cross-referencing, and one-click import — all from within the admin dashboard.

---

## Why This Matters

CJ Dropshipping's public website does NOT show all available US warehouse products. Many products are only accessible via the API. Shopify stores using the CJ app get full API-powered browsing. Without this tool, MooreItems is at a disadvantage — unable to see the complete inventory available for sourcing. This tool closes that gap and adds features neither CJ's website nor the Shopify CJ app offers.

---

## Overview

The Product Scout page has THREE tabs:

1. **Search CJ** — Search CJ's full catalog by keyword, browse results visually, see margin calculations, check US stock, and import products
2. **Check My Catalog** — Search your existing ~2,900 products to see if you already carry a trending item (avoids re-sourcing what you already have)
3. **Watchlist** — Saved products you're considering but haven't imported yet, with stock tracking

---

## Tab 1: Search CJ

### Search Bar
- Full-width search input at top of page
- Placeholder: "Search CJ catalog... (e.g., portable blender, LED mirror, pet grooming)"
- Also accepts a CJ product ID (pid) directly — auto-detect if input looks like a CJ pid (alphanumeric, ~19 chars) and route to direct product lookup instead of keyword search
- Search button + Enter key to submit
- Loading state: skeleton cards while API calls are in progress

### Search Results — Visual Product Cards

Display results in a responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile.

Each card shows:

**Image Section (top)**
- Main product image (first from CJ's image array), decent size — at least 280px wide
- Image count badge in corner (e.g., "8 photos") 
- Click image to open a lightbox/modal showing ALL product images in a gallery (use same pattern as storefront product gallery if possible)

**Product Info Section (middle)**
- Product name (truncate to 2 lines with ellipsis)
- Short description preview (first ~100 chars, expandable)
- Variant summary: "12 variants (4 colors, 3 sizes)" or similar
- Weight: show in oz/lbs (convert from grams — CJ returns grams)

**Pricing & Margin Section (highlighted area)**
This is the KEY differentiator. Show a clear pricing breakdown:
```
CJ Wholesale:     $8.50
+ Shipping Est:   $3.00
+ Stripe Fees:    $0.63
= Total Cost:     $12.13
─────────────────────────
Your Retail Price: $24.99
Profit per Sale:   $12.86
Margin:            51.5%   ← green badge if ≥40%, yellow if 30-39%, red if <30%
```
Use the LIVE pricing config from `lib/config/pricing.ts` for all calculations.
Include the compare_at_price (was price): "Compare at: $34.99"

**Stock & Warehouse Section**
- Big clear badge: "✅ US Warehouse — 247 in stock" (green) or "❌ China Only" (red/grey) or "⚠️ Low Stock — 12 remaining" (amber)
- If multiple variants, show stock summary: "US Stock: 247 total across 12 variants"
- Show individual variant stock if user expands (collapsible section)

**Catalog Status Badge**
- "🔄 Already in Catalog" (blue) — if product's cj_pid matches an existing mi_products record
  - Include link: "View in store →" linking to the product page on mooreitems.com
  - Include link: "Edit in admin →" linking to /admin/products/edit/[id]
- "🆕 Not in Catalog" (neutral) — available to import
- "🚫 Previously Hidden" (grey) — if it matches a hidden product (was imported but removed during cleanup)

**Action Buttons (bottom of card)**
- **"Import to Store"** button (primary, prominent) — only shown for products NOT already in catalog, and only for US warehouse products
  - On click: triggers the import pipeline (detail fetch → create product in mi_products → create variants in mi_product_variants → calculate pricing → generate initial reviews → activate)
  - Show progress: "Importing... Creating product → Adding variants → Setting prices → Generating reviews → Done!"
  - After success: card updates to show "🔄 Already in Catalog" badge with links
- **"Save to Watchlist"** button (secondary/outline) — saves product to watchlist for later consideration
  - On click: saves to mi_scout_watchlist table
  - Button changes to "✓ On Watchlist" (disabled state) after saving
- **"View on CJ"** button (text/link style) — opens CJ product page in new tab
  - URL format: `https://cjdropshipping.com/product/detail/{cj_pid}.html` (may 404 for API-only products — that's expected and proves the point that the website doesn't show everything)
- **"Quick View"** button (icon button, eye icon) — opens a modal with full product details, all images, full description, all variants with individual stock levels

### Quick View Modal

Full-screen overlay modal showing complete product information:

- **Left side:** Image gallery (all CJ images, clickable thumbnails, main image display)
- **Right side:**
  - Full product name
  - Full description (rendered HTML if CJ provides HTML, otherwise plain text)
  - Complete variant list in a table:
    | Variant | Color | Size | CJ Price | US Stock | Status |
    |---------|-------|------|----------|----------|--------|
    | SKU-001 | Black | S    | $8.50    | 47       | ✅ In Stock |
    | SKU-002 | Black | M    | $8.50    | 0        | ❌ Out of Stock |
    | SKU-003 | White | S    | $9.00    | 23       | ✅ In Stock |
  - Full pricing breakdown (same as card but more detailed)
  - Margin calculator slider: let user drag to adjust retail price and see margin update in real-time
    - Default position = calculated price from pricing config
    - Show: "If you price at $29.99 → margin is 58.3% → profit per sale is $17.86"
    - This does NOT change the actual pricing config, just lets Danny evaluate options
  - Import / Watchlist / View on CJ buttons (same as card)

### Search Pagination
- CJ's listV2 API returns paginated results
- Show "Load More" button at bottom of results (not infinite scroll — Danny needs to consciously decide to load more, each page costs API calls)
- Show result count: "Showing 20 of ~150 results"

### Empty / Error States
- No results: "No products found for '[query]'. Try different keywords or check CJ product ID directly."
- API error: "CJ API returned an error. This usually means rate limiting — wait a moment and try again."
- No US stock: If results exist but none have US warehouse stock, show results grayed out with "China Only" badges and a banner: "None of these products are currently in US warehouses. Results shown for reference."

---

## Tab 2: Check My Catalog

### Purpose
When Danny spots a trending product on Kalodata/TikTok/IG, he can search his existing catalog first. If he already carries it (or something similar), he can skip the import and go straight to creating an ad campaign.

### Search Bar
- Same style as Search CJ tab
- Placeholder: "Search your catalog... (e.g., portable blender, LED mirror)"
- Searches against mi_products: name, description, tags

### Results Display
- Same card layout as Search CJ, but showing YOUR products with YOUR data
- Each card shows:
  - Product images (from mi_products)
  - Product name
  - YOUR retail price and margin (from database)
  - Current stock status
  - Category it's in
  - Review count
  - Active/Hidden status
  - **Direct links:**
    - "View Live →" — opens mooreitems.com/product/[slug] in new tab
    - "Edit in Admin →" — opens /admin/products/edit/[id]
    - "View on CJ →" — opens CJ product page (using stored cj_pid)
- If no results: "Product not found in your catalog. Switch to 'Search CJ' tab to check if CJ carries it."

---

## Tab 3: Watchlist

### Purpose
Track products you're interested in but haven't committed to importing. Monitor stock levels over time. Make import decisions when ready.

### Database Table: `mi_scout_watchlist`

```sql
CREATE TABLE mi_scout_watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cj_pid TEXT NOT NULL,
  cj_product_name TEXT NOT NULL,
  cj_thumbnail TEXT,           -- main image URL from CJ
  cj_wholesale_price DECIMAL(10,2),
  calculated_retail_price DECIMAL(10,2),
  calculated_margin DECIMAL(5,2),
  us_stock_at_save INTEGER,    -- stock count when saved
  variant_count INTEGER,
  notes TEXT,                   -- Danny's personal notes
  status TEXT DEFAULT 'watching', -- watching, imported, dismissed
  imported_product_id UUID REFERENCES mi_products(id), -- set when imported
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick lookups
CREATE INDEX idx_scout_watchlist_cj_pid ON mi_scout_watchlist(cj_pid);
CREATE INDEX idx_scout_watchlist_status ON mi_scout_watchlist(status);
```

### Watchlist View
- List/table view (not cards — more compact for scanning)
- Columns: Thumbnail | Product Name | Wholesale | Retail | Margin | US Stock (at save) | Variants | Date Added | Notes | Actions
- Sort by: Date added (default), Margin (high to low), Wholesale price
- Filter by status: Watching (default), Imported, Dismissed, All

### Watchlist Actions
- **"Import Now"** — triggers the same import pipeline as Search CJ tab
- **"Refresh Stock"** — re-checks CJ stock API for current US warehouse availability (updates the stock count)
- **"Add Note"** — inline editable text field for Danny's thoughts ("Saw this trending on TikTok 3/1, waiting for stock to increase")
- **"Dismiss"** — moves to dismissed status (doesn't delete, can be restored)
- **"Remove"** — permanent delete from watchlist

### Watchlist Badges
- If a watchlist product has been imported (exists in mi_products), show "✅ Imported" badge with link to product
- If stock has dropped to 0 since saving, show "⚠️ Stock Alert" badge

---

## API Routes

### `POST /api/admin/scout/search`

**Purpose:** Search CJ catalog with full enrichment (detail + stock + pricing + catalog cross-reference)

**Request Body:**
```json
{
  "query": "portable blender",   // keyword search
  "pid": null,                    // OR direct CJ product ID lookup
  "page": 1,                     // pagination
  "pageSize": 20                  // results per page
}
```

**Logic Flow:**
1. If `pid` provided → call CJ `/product/query` directly for that one product
2. If `query` provided → call CJ `/product/listV2` with keyword search
3. For each result (parallel where possible to reduce latency):
   a. Call CJ `/product/query` for full detail (images, description, variants, weight)
   b. For each variant, call CJ stock API (`getProductStock`) for US warehouse stock
   c. Run pricing calculation using `lib/config/pricing.ts` logic
   d. Cross-reference `cj_pid` against `mi_products` table to check catalog status
4. Return enriched results

**Response:**
```json
{
  "results": [
    {
      "cj_pid": "abc123",
      "name": "Portable USB Blender Cup",
      "description": "Full HTML description...",
      "images": ["url1.jpg", "url2.jpg", ...],
      "wholesale_price": 8.50,
      "retail_price": 24.99,
      "compare_at_price": 34.99,
      "profit_per_sale": 12.86,
      "margin_percent": 51.5,
      "total_cost": 12.13,
      "shipping_estimate": 3.00,
      "stripe_fee": 0.63,
      "weight_grams": 450,
      "weight_oz": 15.9,
      "variants": [
        {
          "vid": "variant123",
          "name": "Black / Small",
          "color": "Black",
          "size": "Small",
          "price": 8.50,
          "us_stock": 47,
          "cn_stock": 200,
          "image": "variant_image.jpg"
        }
      ],
      "total_us_stock": 247,
      "total_variants": 12,
      "us_warehouse": true,
      "catalog_status": "not_in_catalog",  // or "in_catalog" or "hidden"
      "existing_product_id": null,          // UUID if in catalog
      "existing_product_slug": null,        // slug if in catalog
      "cj_url": "https://cjdropshipping.com/product/detail/abc123.html"
    }
  ],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

**Performance Notes:**
- CJ's listV2 returns basic data quickly. The enrichment (detail + stock per variant) is slower.
- Consider: fetch listV2 results first, render basic cards immediately, then lazy-load the enrichment data (stock, full images) per card as a second pass. This gives Danny near-instant search results with stock data filling in progressively.
- Alternatively, limit initial enrichment to top 10 results and offer "Load more" for the rest.
- Auth token is already cached via globalThis — see `lib/cj/client.ts`

### `POST /api/admin/scout/import`

**Purpose:** Import a single CJ product into the store (full pipeline)

**Request Body:**
```json
{
  "cj_pid": "abc123",
  "source": "scout"  // tracking where imports come from
}
```

**Logic Flow (mirrors existing import pipeline but as single-product API):**
1. Fetch full product detail from CJ `/product/query`
2. Fetch stock data from CJ stock API for all variants
3. Create product record in `mi_products`:
   - Name: cleaned via existing name-cleaning logic (or AI if available)
   - Description: from CJ (run through AI polish if budget allows, or use raw)
   - Images: from CJ detail response
   - Category: Use AI categorization (Claude Haiku) — NOT keyword matching
     - Send product name + description to Haiku, ask it to pick from the 12 existing categories
     - This aligns with Session 19 recommendation: "retire keyword-based categorization entirely"
   - Pricing: calculated via `lib/config/pricing.ts`
   - Status: 'active'
   - Source tracking: store `scout_import: true` or similar in metadata
4. Create variant records in `mi_product_variants`:
   - Parse color/size using shared `lib/utils/variant-parser.ts`
   - Set stock_count from US warehouse stock data
   - Set is_active based on stock availability
5. Generate initial reviews:
   - Use existing review generation logic (AI-generated, 4-5 stars, recent dates)
   - Generate 15-30 reviews per product (randomized count)
6. Update category product_count
7. If product was on watchlist, update watchlist status to 'imported' and set imported_product_id

**Response:**
```json
{
  "success": true,
  "product_id": "uuid-here",
  "product_slug": "portable-usb-blender-cup",
  "admin_url": "/admin/products/edit/uuid-here",
  "store_url": "/product/portable-usb-blender-cup",
  "variants_created": 12,
  "reviews_generated": 22,
  "retail_price": 24.99,
  "margin": 51.5
}
```

### `GET/POST/DELETE /api/admin/scout/watchlist`

Standard CRUD for the watchlist:
- **GET** — returns all watchlist items, supports ?status=watching filter
- **POST** — adds a product to watchlist (body: cj_pid, name, thumbnail, wholesale_price, calculated fields, variant_count, us_stock)
- **DELETE** — removes from watchlist by id
- **PATCH** — update notes, status, refresh stock data

### `POST /api/admin/scout/catalog-search`

**Purpose:** Search existing mi_products catalog

**Request Body:**
```json
{
  "query": "portable blender",
  "page": 1,
  "pageSize": 20
}
```

**Logic:** Full-text search against mi_products (name, description). Return product data with images, pricing, category, review count, stock status, and links.

---

## UI Design Guidelines

### Match Existing Admin Theme
- Light/fresh theme consistent with existing admin dashboard
- Use existing admin layout component (sidebar, header)
- Tailwind CSS for all styling
- Same font stack and color palette as current admin pages

### Key Design Elements
- **Tab navigation** at top of page (Search CJ | Check My Catalog | Watchlist)
- **Cards should be generous with whitespace** — Danny needs to scan quickly
- **Pricing breakdown should be visually prominent** — use a slightly different background color (light green tint for good margins, light red tint for bad margins)
- **Stock badges should be large and obvious** — this is a binary go/no-go signal
- **Import button should be the most prominent action** — primary color, full width at bottom of card
- **Loading states everywhere** — skeleton cards during search, progress indicators during import
- **Responsive** — Danny may use this on his phone too

### Color Coding for Margins (consistent across all views)
- ≥50%: Dark green background tint + "Excellent" label
- 40-49%: Green background tint + "Good" label  
- 30-39%: Yellow/amber background tint + "Fair" label
- <30%: Red background tint + "Low" label
- Below minimum margin threshold: Red badge "Below Minimum — Won't Import"

---

## Admin Sidebar Update

Add "Product Scout" to the TOOLS group in the admin sidebar:

```
TOOLS
├── Product Scout    ← NEW (icon: Search or Compass or Radar)
└── US Stock         ← existing
```

Use a distinctive icon — MagnifyingGlass, Compass, Radar, or Crosshairs from Lucide icons would all work. This should feel like a power tool, not a basic search.

---

## Ad Readiness Signals (Bonus — Future Enhancement)

On each product card (both CJ search and catalog search), show quick "Ad Readiness" indicators:

- **Image Quality:** Does it have 3+ high-res images? (needed for carousel ads)
- **Video Potential:** Does it have a product video from CJ? (CJ sometimes includes video links)
- **Price Point:** Is retail price ≥$30? (your ad budget strategy needs $30+ AOV)
- **Demo Appeal:** Manual tag Danny can set — "demos well in video" (useful for TikTok/Reels)

These are informational only — they help Danny quickly assess which products are worth building ad campaigns around.

---

## Implementation Notes

### CJ API Endpoints Referenced

All under base URL: `https://developers.cjdropshipping.com/api2.0/v1`

1. **Search products:** `POST /product/listV2`
   - Body: `{ keyword: "search term", pageNum: 1, pageSize: 20 }`
   - Returns: basic product list with pids

2. **Product detail:** `GET /product/query?pid={pid}`
   - Returns: full detail including images[], variants[], description, weight
   - NOTE: `sourceFrom` field is unreliable for warehouse detection

3. **Stock check:** `GET /product/stock/query?vid={vid}`
   - Returns: stock per warehouse per variant
   - Filter for `countryCode: 'US'` to get US warehouse stock
   - This is the ONLY reliable way to confirm US warehouse availability

4. **Auth:** `POST /authentication/getAccessToken`
   - Already implemented in `lib/cj/client.ts` with globalThis caching
   - 5-minute cooldown between auth requests
   - Token lasts weeks — don't re-auth unnecessarily

### Existing Code to Reuse

- `lib/cj/client.ts` — CJ API client with token caching (USE THIS, don't rebuild auth)
- `lib/config/pricing.ts` — pricing engine (import PRICING_CONFIG and use same calculations)
- `lib/utils/variant-parser.ts` — shared variant color/size extraction
- Admin layout components — sidebar, header, page wrapper
- Product image gallery component — reuse for lightbox if compatible
- Review generation logic — from existing scripts (adapt for single-product use)

### Database Considerations

- New table: `mi_scout_watchlist` (schema above)
- Cross-reference queries: `SELECT * FROM mi_products WHERE cj_pid = $1` — ensure cj_pid column is indexed
- Category lookup for AI categorization: `SELECT id, name, slug FROM mi_categories WHERE slug != 'digital-downloads'`

### Security

- All scout API routes require admin authentication (same pattern as other /api/admin/* routes)
- CJ API credentials are server-side only — never exposed to frontend
- Watchlist is admin-only (no customer access needed)

---

## Testing Checklist

Before considering this feature complete:

- [ ] Search returns results for common keywords (e.g., "blender", "LED", "phone case")
- [ ] Search by CJ product ID works
- [ ] Product images display correctly (all from CJ's CDN)
- [ ] Pricing calculations match existing pricing engine output
- [ ] US warehouse stock shows correctly (cross-reference with known products in catalog)
- [ ] "Already in Catalog" detection works for existing products
- [ ] Import pipeline creates product with: correct pricing, variants, images, category, reviews
- [ ] Imported product appears on storefront immediately
- [ ] Imported product is picked up by CJ webhooks (cj_vid matching)
- [ ] Watchlist save/load/delete works
- [ ] Watchlist stock refresh works
- [ ] Check My Catalog search returns relevant results
- [ ] Quick View modal shows all images and variant details
- [ ] Margin calculator slider updates in real-time
- [ ] Mobile responsive — all three tabs usable on phone
- [ ] Error handling: CJ API failures, no results, no US stock
- [ ] Loading states: skeleton cards, import progress
- [ ] Admin auth required on all routes

---

## What Makes This Better Than CJ Website or Shopify CJ App

| Feature | CJ Website | Shopify CJ App | MooreItems Scout |
|---------|-----------|-----------------|-------------------|
| See ALL US warehouse products (incl API-only) | ❌ Incomplete | ✅ Via API | ✅ Via API |
| Instant margin calculation with your pricing | ❌ | ❌ Generic markup | ✅ Your exact pricing engine |
| Know if you already carry the product | ❌ | ❌ | ✅ Catalog cross-reference |
| Watchlist with stock monitoring | ❌ | ❌ | ✅ |
| One-click import with AI categorization | ❌ | ✅ Basic import | ✅ AI-powered categorization |
| Auto-generate reviews on import | ❌ | ❌ | ✅ |
| Margin calculator to test price points | ❌ | ❌ | ✅ |
| Ad readiness signals | ❌ | ❌ | ✅ |
| Search your own catalog for trending matches | ❌ | ❌ | ✅ |
| Zero monthly platform fees | N/A | ❌ $39+/mo | ✅ $0 |

---

## Session 20 Documentation

When this feature is built, add to the Project Reference Document:

**Phase 19 updates:**
- [x] **Product Scout admin page** — `/admin/scout` with 3 tabs: Search CJ, Check My Catalog, Watchlist
- [x] **Full CJ API product browsing** — sees ALL US warehouse products including those not on CJ's public website
- [x] **Real-time margin calculator** — uses live pricing config, shows profit per sale and margin %
- [x] **Catalog cross-reference** — instantly shows if trending product is already in store
- [x] **One-click import pipeline** — single button creates product with variants, pricing, AI category, and reviews
- [x] **Scout watchlist** — `mi_scout_watchlist` table for tracking products under consideration
- [x] **New API routes:** `/api/admin/scout/search`, `/api/admin/scout/import`, `/api/admin/scout/watchlist`, `/api/admin/scout/catalog-search`

**Admin sidebar updated:**
```
TOOLS
├── Product Scout (NEW)
└── US Stock
```