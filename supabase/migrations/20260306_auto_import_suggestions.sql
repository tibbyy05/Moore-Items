-- Auto-Import Suggestions table
-- Stores AI-scored product candidates from CJ for admin review
CREATE TABLE mi_auto_import_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id text NOT NULL,
  cj_pid text NOT NULL,
  product_name text NOT NULL,
  product_image text,
  cj_category text,
  cj_price decimal NOT NULL,
  shipping_cost decimal,
  retail_price decimal,
  margin_percent decimal,
  warehouse text DEFAULT 'US',
  us_stock integer DEFAULT 0,
  variant_count integer DEFAULT 0,
  ai_score integer,
  ai_reasoning text,
  ai_season_ok boolean DEFAULT true,
  ai_brand_fit boolean DEFAULT true,
  ai_quality_ok boolean DEFAULT true,
  status text DEFAULT 'pending',
  imported_product_id uuid REFERENCES mi_products(id),
  error_message text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX idx_auto_import_batch ON mi_auto_import_suggestions(batch_id);
CREATE INDEX idx_auto_import_status ON mi_auto_import_suggestions(status);
CREATE UNIQUE INDEX idx_auto_import_cj_pid ON mi_auto_import_suggestions(cj_pid) WHERE status = 'pending';
