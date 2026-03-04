-- Product Scout Watchlist table
CREATE TABLE IF NOT EXISTS mi_scout_watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cj_pid TEXT NOT NULL,
  cj_product_name TEXT NOT NULL,
  cj_thumbnail TEXT,
  cj_wholesale_price DECIMAL(10,2),
  calculated_retail_price DECIMAL(10,2),
  calculated_margin DECIMAL(5,2),
  us_stock_at_save INTEGER,
  variant_count INTEGER,
  notes TEXT,
  status TEXT DEFAULT 'watching',
  imported_product_id UUID REFERENCES mi_products(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scout_watchlist_cj_pid ON mi_scout_watchlist(cj_pid);
CREATE INDEX IF NOT EXISTS idx_scout_watchlist_status ON mi_scout_watchlist(status);

-- Ensure cj_pid is indexed on mi_products for cross-referencing
CREATE INDEX IF NOT EXISTS idx_mi_products_cj_pid ON mi_products(cj_pid);
