-- ============================================================
-- Promo Code Management Migration
-- Safe to run multiple times (idempotent with IF NOT EXISTS)
-- ============================================================

-- 1. Extend mi_discount_codes with new columns
-- ============================================================

DO $$
BEGIN
  -- code_type: 'general' (store promo) or 'influencer' (tracked affiliate)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'code_type') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN code_type TEXT DEFAULT 'general';
  END IF;

  -- Influencer fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'influencer_name') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN influencer_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'influencer_email') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN influencer_email TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'influencer_platform') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN influencer_platform TEXT;
  END IF;

  -- Payout fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'payout_per_use') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN payout_per_use NUMERIC;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'payout_percent') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN payout_percent NUMERIC;
  END IF;

  -- Denormalized stats
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'total_uses') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN total_uses INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'total_revenue') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN total_revenue NUMERIC DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'total_discount_given') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN total_discount_given NUMERIC DEFAULT 0;
  END IF;

  -- Scheduling & limits
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'max_uses') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN max_uses INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'starts_at') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN starts_at TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'expires_at') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN expires_at TIMESTAMPTZ;
  END IF;

  -- Notes
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'notes') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN notes TEXT;
  END IF;

  -- updated_at (created_at should already exist)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'mi_discount_codes' AND column_name = 'updated_at') THEN
    ALTER TABLE mi_discount_codes ADD COLUMN updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- 2. Create mi_discount_code_usage table
-- ============================================================

CREATE TABLE IF NOT EXISTS mi_discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID REFERENCES mi_discount_codes(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  order_id UUID,
  order_number TEXT,
  customer_email TEXT,
  discount_amount NUMERIC DEFAULT 0,
  order_subtotal NUMERIC DEFAULT 0,
  order_total NUMERIC DEFAULT 0,
  influencer_payout NUMERIC DEFAULT 0,
  payout_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'void'
  used_at TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookups by code and order
CREATE INDEX IF NOT EXISTS idx_discount_usage_code_id ON mi_discount_code_usage(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_discount_usage_order_id ON mi_discount_code_usage(order_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_discount_usage_unique_order ON mi_discount_code_usage(discount_code_id, order_id);

-- 3. RPC function to atomically increment stats
-- ============================================================

CREATE OR REPLACE FUNCTION increment_discount_code_stats(
  p_code_id UUID,
  p_revenue NUMERIC,
  p_discount NUMERIC
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE mi_discount_codes
  SET
    total_uses = COALESCE(total_uses, 0) + 1,
    total_revenue = COALESCE(total_revenue, 0) + COALESCE(p_revenue, 0),
    total_discount_given = COALESCE(total_discount_given, 0) + COALESCE(p_discount, 0),
    used_count = COALESCE(used_count, 0) + 1,
    updated_at = now()
  WHERE id = p_code_id;
END;
$$;

-- 4. Update existing seeded codes with new field defaults
-- ============================================================

UPDATE mi_discount_codes
SET
  code_type = COALESCE(code_type, 'general'),
  total_uses = COALESCE(total_uses, used_count, 0),
  total_revenue = COALESCE(total_revenue, 0),
  total_discount_given = COALESCE(total_discount_given, 0),
  updated_at = COALESCE(updated_at, now())
WHERE code_type IS NULL OR updated_at IS NULL;

-- 5. Enable RLS on usage table (admin-only access via service role)
-- ============================================================

ALTER TABLE mi_discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (admin client uses service role)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'mi_discount_code_usage' AND policyname = 'Service role full access on usage') THEN
    CREATE POLICY "Service role full access on usage"
      ON mi_discount_code_usage
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END $$;
