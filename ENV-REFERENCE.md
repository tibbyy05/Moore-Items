# Environment Variables Reference

> Variable names and purposes only — no values. See `.env.local` for actual secrets.

| Variable | Purpose | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for client-side database access and auth. | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key for client-side queries and authentication. | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key for server-side admin operations (bypasses RLS). | Yes |
| `CJ_API_KEY` | CJ Dropshipping API key for product imports, inventory sync, and order fulfillment. | Yes |
| `CJ_API_BASE_URL` | Base URL for the CJ Dropshipping API (v2.0). | Yes |
| `NEXT_PUBLIC_SITE_URL` | Public site URL used for SEO metadata, canonical links, and OAuth redirects. | Yes |
| `NEXT_PUBLIC_META_PIXEL_ID` | Facebook/Meta Pixel ID for ad conversion tracking and analytics. | No |
| `ADMIN_EMAIL` | Admin email address for order notifications and system alerts. | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key for server-side payment processing and refunds. | Yes |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for client-side checkout session creation. | Yes |
| `STRIPE_WEBHOOK_SECRET` | Signing secret to verify incoming Stripe webhook payloads. | Yes |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key for AI product description polishing and auto-categorization. | No |
| `SENDGRID_API_KEY` | SendGrid API key for transactional and marketing emails. | Yes |
| `SENDGRID_FROM_EMAIL` | Sender email address for all outgoing SendGrid emails. | Yes |
| `SENDGRID_FROM_NAME` | Display name shown on outgoing emails (defaults to brand name). | No |
| `STOCK_SYNC_SECRET` | Secret token to authenticate stock sync cron/webhook requests. | Yes |
| `AUTO_IMPORT_SECRET` | Secret token to authenticate auto-import cron/webhook requests. | Yes |
| `CJ_WEBHOOK_SECRET` | HMAC secret to verify incoming CJ Dropshipping webhook payloads. | Yes |
| `HMAC_SECRET` | General-purpose HMAC secret for request signing and verification. | Yes |
