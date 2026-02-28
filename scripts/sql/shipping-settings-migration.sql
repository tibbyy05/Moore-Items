-- Create mi_settings table for storing app configuration (shipping, etc.)
CREATE TABLE IF NOT EXISTS mi_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default shipping config
INSERT INTO mi_settings (key, value)
VALUES (
  'shipping_config',
  '{
    "freeShippingEnabled": true,
    "freeShippingThreshold": 50,
    "freeShippingWeightCapGrams": 10000,
    "useCJFreightQuotes": true,
    "freightMarkupPercent": 15,
    "flatRateShipping": 4.99,
    "minimumShippingCharge": 2.99
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- Allow admin service role full access (RLS policy)
ALTER TABLE mi_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to mi_settings"
  ON mi_settings
  FOR ALL
  USING (true)
  WITH CHECK (true);
