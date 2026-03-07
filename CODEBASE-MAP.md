# MooreItems Codebase Map

> Next.js 13.5 e-commerce platform with CJ dropshipping, Stripe payments, Supabase DB, SendGrid email, and AI product enrichment.

---

## Config Files

```
next.config.js               — Next.js config: disables ESLint on build, unoptimizes images for Netlify
tailwind.config.ts            — Custom navy/gold theme, fadeUp/shimmer/slideInRight animations
netlify.toml                  — Netlify deploy config with Next.js plugin and security headers (CSP, X-Frame-Options)
tsconfig.json                 — TypeScript config with @/* path alias
postcss.config.js             — PostCSS with Tailwind and Autoprefixer
components.json               — Shadcn/ui library config with Tailwind theme integration
.eslintrc.json                — ESLint extending Next.js core web vitals
middleware.ts                 — Auth gate for /account, admin route protection, shop noindex rules
```

---

## API Routes

### Products & Search
```
app/api/products/route.ts              — GET products with pagination, filtering (category/price/warehouse), sorting
app/api/products/[slug]/route.ts       — GET single product by slug with full details
app/api/categories/route.ts            — GET all active categories with product counts, or single by slug
app/api/search/route.ts                — GET search products by name query (max 6 results)
```

### Reviews
```
app/api/reviews/[productId]/route.ts   — GET reviews for a product with pagination
app/api/reviews/submit/route.ts        — POST submit review (requires verified purchase via email match)
```

### Checkout & Payments
```
app/api/checkout/route.ts              — POST create Stripe checkout session (rate limited: 5/10min)
app/api/discount/validate/route.ts     — POST validate and apply discount codes
app/api/shipping/estimate/route.ts     — POST calculate shipping costs for cart
app/api/downloads/[orderId]/[itemId]/route.ts — GET download digital product with token verification
```

### Orders
```
app/api/orders/[sessionId]/route.ts    — GET order details by Stripe session ID
app/api/orders/lookup/route.ts         — POST customer order lookup by email + order number
```

### Webhooks
```
app/api/webhooks/stripe/route.ts       — POST Stripe webhook: payment completion, order creation, fulfillment, landing page conversion tracking
app/api/webhooks/cj/route.ts           — POST CJ webhook: stock/order/tracking updates
```

### Contact & Marketing
```
app/api/contact/route.ts               — POST contact form submission (rate limited: 3/hour) via SendGrid
app/api/subscribe/route.ts             — POST newsletter email subscription
app/api/assistant/route.ts             — POST AI shopping assistant chatbot
```

### SEO & Feeds
```
app/api/feeds/google-merchant/route.ts — GET Google Merchant Center product feed (XML/CSV)
```

### Auto-Import
```
app/api/auto-import/route.ts           — GET/POST auto-import pending product suggestions
app/api/auto-import/suggest/route.ts   — POST generate product import suggestions
app/api/auto-import/approve/route.ts   — POST approve auto-import candidates
app/api/auto-import/reject/route.ts    — POST reject auto-import candidates
```

### Admin — Dashboard & Orders
```
app/api/admin/dashboard/route.ts       — GET dashboard analytics (sales, orders, products) with period filter
app/api/admin/orders/route.ts          — GET list orders with search, filtering, pagination
app/api/admin/orders/[id]/route.ts     — GET/PUT fetch or update single order
app/api/admin/orders/update/route.ts   — POST update order status, fulfillment, tracking
app/api/admin/orders/fulfill/route.ts  — POST fulfill orders via CJ dropshipping API
app/api/admin/orders/refund/route.ts   — POST process Stripe refunds
app/api/admin/orders/tracking/route.ts — GET fetch tracking info from CJ
app/api/admin/orders/sync-tracking/route.ts — POST sync order tracking status from CJ
```

### Admin — Products
```
app/api/admin/products/route.ts              — GET/POST list or create products
app/api/admin/products/stats/route.ts        — GET product performance statistics
app/api/admin/products/add/route.ts          — POST add new product to catalog
app/api/admin/products/upload-digital/route.ts — POST upload digital product files
app/api/admin/products/import-cj/route.ts    — POST import products from CJ API
app/api/admin/products/polish/route.ts       — POST AI-enhance product descriptions
app/api/admin/products/generate-reviews/route.ts — POST generate test reviews
```

### Admin — Settings & Pricing
```
app/api/admin/pricing-config/route.ts        — GET/PUT manage pricing markup and margin settings
app/api/admin/shipping-config/route.ts       — GET/PUT manage shipping rates and config
app/api/admin/category-pricing/route.ts      — GET/PUT category-specific pricing overrides
app/api/admin/promo-codes/route.ts           — GET/POST create and list promo codes
app/api/admin/promo-codes/[id]/route.ts      — GET/PUT/DELETE manage individual promo code
app/api/admin/promo-codes/[id]/mark-paid/route.ts — POST mark promo code order as paid
app/api/admin/reprice/route.ts               — POST recalculate prices based on markup rules
```

### Admin — Inventory & Sync
```
app/api/admin/catalog/stock-sync/route.ts    — POST sync inventory from CJ warehouse
app/api/admin/catalog/health-check/route.ts  — GET check catalog health and missing data
app/api/admin/check-us-stock/route.ts        — POST query US warehouse stock levels
app/api/admin/sync-us-products/route.ts      — POST import products from US warehouse
app/api/admin/sync-reviews/route.ts          — POST sync product reviews from CJ
app/api/admin/sync-shipping/route.ts         — POST sync shipping costs from CJ freight API
app/api/admin/verify-product/route.ts        — POST verify product data validity
```

### Admin — Landing Pages
```
app/api/admin/landing-pages/route.ts          — GET list / POST create
app/api/admin/landing-pages/[id]/route.ts     — GET / PUT / DELETE single
app/api/admin/landing-pages/generate/route.ts — AI copy generation + auto promo code creation
```

### Public — Landing Pages
```
app/api/lp/track-view/route.ts               — Public view counter increment (no auth)
```

### Admin — Tools
```
app/api/admin/customers/route.ts                  — GET list customers with order history
app/api/admin/scout/catalog-search/route.ts       — POST search CJ catalog for new products
app/api/admin/scout/search/route.ts               — POST product scout search tool
app/api/admin/scout/import/route.ts               — POST import scouted products into catalog
app/api/admin/scout/watchlist/route.ts             — GET/POST manage product watchlist
```

---

## Pages

### Storefront
```
app/layout.tsx                       — Root layout: fonts (Playfair/DM Sans), providers, Header, Footer, JSON-LD
app/page.tsx                         — Homepage: hero, featured products, recently viewed, categories, newsletter
app/shop/page.tsx                    — Shop: product grid, filtering (price/category/warehouse), sorting, pagination
app/product/[slug]/page.tsx          — Product detail: images, variants, pricing, reviews, related, schema markup
app/category/[slug]/page.tsx         — Category landing page with filtered products
app/search/page.tsx                  — Search results with pagination and filters
app/deals/page.tsx                   — Deals and promotions page
app/new-arrivals/page.tsx            — New products showcase
app/trending/page.tsx                — Trending products carousel
app/cart/page.tsx                    — Shopping cart: items, discount codes, recommendations, checkout, deep-link params (?add=&qty=&promo=)
app/lp/[slug]/page.tsx               — Public landing page (server, generateMetadata, notFound if draft)
app/lp/[slug]/LandingPageClient.tsx   — 9-section landing page client (hero, quantity selector, benefits, feature blocks, social proof, testimonials, FAQ, closing CTA, minimal header/footer)
```

### Orders
```
app/order/confirmation/page.tsx      — Post-payment order confirmation
app/order/lookup/page.tsx            — Customer order lookup by email + order number
```

### Auth
```
app/login/page.tsx                   — Login with email/password and Google OAuth
app/signup/page.tsx                  — User registration
app/forgot-password/page.tsx         — Password reset request
app/reset-password/page.tsx          — Password reset confirmation
```

### Account
```
app/account/layout.tsx               — Account dashboard layout
app/account/page.tsx                 — Account overview: recent orders, wishlist
app/account/orders/page.tsx          — Order history with status tracking
app/account/orders/[id]/page.tsx     — Individual order details
app/account/settings/page.tsx        — Profile and preferences
app/account/addresses/page.tsx       — Saved shipping addresses
app/account/wishlist/page.tsx        — Saved wishlist items
```

### Admin
```
app/admin/layout.tsx                 — Admin layout with sidebar and topbar
app/admin/page.tsx                   — Dashboard: sales metrics, recent orders, top products
app/admin/login/page.tsx             — Admin login portal
app/admin/orders/page.tsx            — Order management: search, filter, fulfill
app/admin/products/page.tsx          — Product catalog management
app/admin/products/add/page.tsx      — Add new product form
app/admin/products/edit/[id]/page.tsx — Edit product details
app/admin/customers/page.tsx         — Customer database and analytics
app/admin/analytics/page.tsx         — Advanced analytics and reporting
app/admin/pricing/page.tsx           — Pricing config and margin settings
app/admin/shipping/page.tsx          — Shipping rates config
app/admin/promo-codes/page.tsx       — Discount code management
app/admin/auto-import/page.tsx       — Auto-import suggestions review
app/admin/catalog-health/page.tsx    — Catalog quality and data completeness audit
app/admin/us-stock/page.tsx          — US warehouse inventory management
app/admin/product-scout/page.tsx     — Product discovery and sourcing tool
app/admin/ad-campaigns/page.tsx      — Advertising campaign management
app/admin/landing-pages/page.tsx     — Landing pages list (views, conversions, live/draft toggle, delete)
app/admin/landing-pages/new/page.tsx — New landing page builder
app/admin/landing-pages/[id]/edit/page.tsx — Edit landing page builder
```

### Legal / Info
```
app/about/page.tsx                   — About the company
app/contact/page.tsx                 — Contact form
app/faq/page.tsx                     — Frequently asked questions
app/privacy-policy/page.tsx          — Privacy policy
app/terms/page.tsx                   — Terms of service
app/shipping-policy/page.tsx         — Shipping policy
app/returns/page.tsx                 — Returns and refunds policy
```

---

## Components

### Layout
```
components/layout/Header.tsx              — Main nav: logo, search, categories menu, cart preview, user menu
components/layout/Footer.tsx              — Footer: links, company info, newsletter, social links
```

### Storefront
```
components/storefront/ProductCard.tsx     — Product card: image, price, rating, wishlist, quick view
components/storefront/QuickViewModal.tsx  — Quick product preview modal
components/storefront/ImageGallery.tsx    — Product image carousel/gallery
components/storefront/SearchBar.tsx       — Search input with autocomplete suggestions
components/storefront/MegaMenu.tsx        — Category navigation mega menu
components/storefront/CartPreview.tsx     — Mini cart preview in header
components/storefront/HeroSlider.tsx      — Homepage hero banner carousel
components/storefront/CategoryShowcase.tsx — Featured category display
components/storefront/TrendingCarousel.tsx — Trending products horizontal carousel
components/storefront/RecentlyViewed.tsx  — Recently viewed products widget
components/storefront/EmailPopup.tsx      — Email capture modal
components/storefront/NewsletterSignup.tsx — Newsletter subscription form
components/storefront/AnnouncementBar.tsx — Top banner for promotions
components/storefront/TrustBadges.tsx     — Trust badges and certifications
components/storefront/SkeletonCard.tsx    — Loading placeholder for product cards
components/storefront/Toast.tsx           — Notification toast component
components/storefront/ToastProvider.tsx   — Toast context provider
components/storefront/ShoppingAssistant.tsx — AI chatbot assistant
components/storefront/ShoppingAssistantWrapper.tsx — Shopping assistant error boundary wrapper
```

### Product
```
components/product/ProductCard.tsx        — Product card variant
components/product/ProductGrid.tsx        — Responsive product grid with pagination
components/product/ProductGallery.tsx     — Product image gallery
components/product/VariantSelector.tsx    — Color/size variant selection UI
components/product/QuantityStepper.tsx    — Quantity input with +/- buttons
components/product/PriceDisplay.tsx       — Price with discount/compare-at display
```

### Cart
```
components/cart/CartDrawer.tsx            — Slide-out cart panel with item list
components/cart/CartItem.tsx              — Cart item row with quantity/remove controls
components/cart/CartSummary.tsx           — Subtotal, shipping, tax, and total summary
```

### Auth
```
components/auth/AuthForm.tsx             — Reusable login/signup form
components/auth/GoogleButton.tsx         — Google OAuth sign-in button
```

### Admin
```
components/admin/AdminLayout.tsx         — Admin section layout with sidebar
components/admin/Sidebar.tsx             — Admin nav sidebar with menu items and counts
components/admin/TopBar.tsx              — Admin top navigation bar
components/admin/StatCard.tsx            — Dashboard metric card with icon and value
components/admin/BarChart.tsx            — Recharts bar chart for analytics
components/admin/PolishModal.tsx         — AI product description enhancement modal
components/admin/StatusBadge.tsx         — Status indicator badge (pending/shipped/live/etc)
components/admin/LandingPageBuilder.tsx  — Shared builder component (product picker, page settings, discount tiers, AI generation, section editors, save/publish bar)
```

### Providers
```
components/providers/CartProvider.tsx     — Cart state context with localStorage persistence
components/providers/AuthProvider.tsx     — Authentication state context
components/providers/WishlistProvider.tsx — Wishlist items context
components/providers/CategoriesProvider.tsx — Category data context
```

### SEO & Tracking
```
components/seo/PaginationHead.tsx        — Pagination meta tags (rel prev/next)
components/MetaPixel.tsx                 — Facebook Pixel tracking script
components/CookieConsent.tsx             — Cookie consent banner
components/system/AbortErrorSuppressor.tsx — Error boundary for fetch abort errors
```

### UI (Shadcn/ui)
```
components/ui/                           — Shadcn/Radix UI primitives: button, input, label, badge, card,
                                           dialog, drawer, tabs, accordion, select, checkbox, table,
                                           pagination, breadcrumb, dropdown-menu, popover, chart,
                                           carousel, calendar, skeleton, toast, and many more
```

---

## Lib / Utilities

### Core
```
lib/types.ts                             — TypeScript interfaces: Category, Product, ProductVariant, Review, CartItem
lib/utils.ts                             — cn() utility for Tailwind class merging
lib/stripe.ts                            — Stripe SDK initialization
lib/pricing.ts                           — Calculate retail price from cost (markup, fees, margins)
lib/shipping.ts                          — Calculate shipping costs (flat rate, weight tiers, CJ freight)
lib/download-token.ts                    — Generate/validate download tokens for digital products
lib/mock-data.ts                         — Mock product/category data for development
lib/admin-mock-data.ts                   — Mock admin dashboard data
```

### Config
```
lib/config/pricing.ts                    — Pricing config: markups, margins, Stripe fees for US/CN warehouses
lib/config/shipping.ts                   — Shipping config: rates, weight tiers, free shipping thresholds
lib/config/subcategory-tags.ts           — Category/subcategory mappings for product filtering
```

### Supabase
```
lib/supabase/server.ts                   — Server-side Supabase client for server components and API routes
lib/supabase/client.ts                   — Client-side Supabase client for browser
lib/supabase/admin.ts                    — Admin Supabase client with service role key
```

### CJ Dropshipping
```
lib/cj/client.ts                         — CJ API client with auth and product/variant interfaces
lib/cj/sync.ts                           — Sync products from CJ into Supabase
lib/cj/fulfill-order.ts                  — Fulfill orders through CJ API
lib/cj/reviews.ts                        — Fetch and sync reviews from CJ
lib/cj/shipping-sync.ts                  — Sync shipping info from CJ
lib/cj/freight.ts                        — Calculate freight costs via CJ API
```

### Email (SendGrid)
```
lib/email/sendgrid.ts                    — SendGrid client with helper functions
lib/email/templates/order-confirmation.ts — Order confirmation email template
lib/email/templates/abandoned-cart.ts     — Cart recovery email template
lib/email/templates/shipping-update.ts   — Shipping notification template
lib/email/templates/new-order-admin.ts   — Admin order notification template
lib/email/templates/contact-form.ts      — Contact form response templates
lib/email/templates/health-check.ts      — Catalog health check report template
lib/email/templates/stock-sync.ts        — Inventory sync notification template
lib/email/templates/auto-import-digest.ts — Auto-import suggestions digest template
```

### SEO
```
lib/seo/constants.ts                     — Site name, URL, and SEO constants
lib/seo/fetchers.ts                      — Fetch product/category data for metadata generation
lib/seo/json-ld.tsx                      — Schema.org JSON-LD components (Organization, Website, Product, Breadcrumb)
lib/seo/google-categories.ts             — Google product category mappings
```

### Utils
```
lib/utils/variant-availability.ts        — Variant availability matrix and combo validation
lib/utils/variant-parser.ts              — Parse and normalize product variant data
```

---

## Hooks

```
hooks/useVariantSelection.ts             — Manage product variant selection with availability checking
hooks/use-toast.ts                       — Trigger toast notifications
```

---

## Scripts

### Product Import & Data
```
scripts/import-cn-products.js            — Batch import products from CJ China warehouse
scripts/import-us-products.js            — Batch import products from CJ US warehouse
scripts/find-new-cj-pids.js             — Discover new product IDs from CJ catalog
scripts/enrich-us-products.js            — Enrich US product data with descriptions and images
scripts/ai-categorize-remaining.js       — Auto-categorize products using AI
scripts/ai-clean-names.js               — Normalize product names across inventory
scripts/cleanup-products-v2.js           — Data cleanup and deduplication
scripts/bulk-polish.js                   — Bulk AI-enhance product descriptions
```

### Product Maintenance
```
scripts/check-product-stock.js           — Check inventory levels for specific products
scripts/fetch-weights.js                 — Fetch and update product weight data
scripts/fetch-missing-images.js          — Download and store missing product images
scripts/fix-prices.js                    — Recalculate all prices based on current markup rules
scripts/fix-orphaned-variants.js         — Repair variant records without parent products
scripts/compress-images.js              — Optimize product images for web delivery
scripts/export-products-excel.js         — Export catalog to XLSX with categories and stats
```

### Testing & QA
```
scripts/generate-reviews-v3.js           — Generate test customer reviews
scripts/check-cj-product.js             — Diagnostic: verify CJ product data and stock
scripts/test-email.js                    — Test SendGrid email config and templates
scripts/test-stock-sync.js              — Test inventory sync from CJ
```

### Webhooks & Ops
```
scripts/register-cj-webhooks.js          — Register webhook endpoints with CJ API
```

### SQL Migrations
```
scripts/sql/discount-save10.sql          — Create SAVE10 promo code
scripts/sql/promo-codes-migration.sql    — Promo codes table migration
scripts/sql/shipping-settings-migration.sql — Shipping config table migration
scripts/sql/mi_email_subscribers.sql     — Newsletter subscribers table migration
```

---

## Database Tables (Supabase/PostgreSQL)

```
mi_products          — Main product catalog
mi_product_variants  — Color/size variants per product
mi_categories        — Product categories
mi_orders            — Customer orders
mi_order_items       — Order line items
mi_admin_profiles    — Admin user roles
mi_reviews           — Customer product reviews
mi_promo_codes       — Discount codes
mi_landing_pages     — Landing pages (slug, headline, sections jsonb, quantity_discounts, promo_codes jsonb, views, conversions, is_active, product_ids)
mi_settings          — Key/value configuration store
mi_email_subscribers — Newsletter subscribers
```

---

## Key Learnings

- `mi_landing_pages.product_ids` is a UUID array but the builder sends `product_id` (singular) — the API wraps it into `[product_id]`
- `mi_landing_pages.is_active` (boolean) maps to `status: 'live' | 'draft'` in the admin UI and API
- Stripe webhook (`checkout.session.completed`) now runs `trackLandingPageConversion()` after orders — matches `discount_code` against `promo_codes` jsonb values in `mi_landing_pages` and increments `conversions`
- Landing page view tracking moved from server-side (page.tsx) to client-side (LandingPageClient.tsx → POST /api/lp/track-view) for accuracy
- AI content generation uses Anthropic SDK (`claude-sonnet-4-20250514`) and auto-creates promo codes in `mi_promo_codes` with format `LP-[SLUG]-[QTY]`
- StatusBadge component has a `'live'` type (green) added for landing page status display

---

## Phase History

- **Landing Pages** — Complete. Admin CRUD, AI copy generation, public landing page with 9-section layout, view/conversion tracking via Stripe webhook, cart deep-link support.
