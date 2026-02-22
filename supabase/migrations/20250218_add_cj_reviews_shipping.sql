-- Add CJ review metadata columns
ALTER TABLE mi_reviews ADD COLUMN IF NOT EXISTS cj_comment_id bigint UNIQUE;
ALTER TABLE mi_reviews ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]';
ALTER TABLE mi_reviews ADD COLUMN IF NOT EXISTS reviewer_country text;
ALTER TABLE mi_reviews ADD COLUMN IF NOT EXISTS source text DEFAULT 'customer';

-- Add review summary columns on products
ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS average_rating numeric(2,1) DEFAULT 0;

-- Add shipping enrichment columns on products
ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS delivery_cycle_days text;
ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS available_warehouses jsonb DEFAULT '[]';
ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS shipping_estimate text;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_mi_reviews_cj_comment_id ON mi_reviews(cj_comment_id);
CREATE INDEX IF NOT EXISTS idx_mi_reviews_product_source ON mi_reviews(product_id, source);
