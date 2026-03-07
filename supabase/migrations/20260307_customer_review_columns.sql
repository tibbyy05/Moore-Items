-- Add columns needed for real customer reviews
ALTER TABLE mi_reviews
  ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reviewer_email TEXT,
  ADD COLUMN IF NOT EXISTS order_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'approved';

-- Index for purchase verification lookup
CREATE INDEX IF NOT EXISTS idx_mi_reviews_product_source
  ON mi_reviews(product_id, source);

-- Unique index to prevent duplicate customer reviews per product
CREATE UNIQUE INDEX IF NOT EXISTS idx_mi_reviews_unique_customer_product
  ON mi_reviews(reviewer_email, product_id)
  WHERE source = 'customer';
