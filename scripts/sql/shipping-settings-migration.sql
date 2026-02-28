-- Create mi_settings table for storing app configuration (shipping, etc.)
CREATE TABLE IF NOT EXISTS mi_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default shipping config (with weight-based tiers)
INSERT INTO mi_settings (key, value)
VALUES (
  'shipping_config',
  '{
    "freeShippingEnabled": true,
    "freeShippingThreshold": 50,
    "freeShippingWeightCapGrams": 10000,
    "useCJFreightQuotes": true,
    "freightMarkupPercent": 15,
    "minimumShippingCharge": 2.99,
    "weightTiers": [
      { "maxGrams": 500, "price": 4.99, "label": "Light (under 1 lb)" },
      { "maxGrams": 2000, "price": 7.99, "label": "Standard (1-4 lbs)" },
      { "maxGrams": 5000, "price": 12.99, "label": "Medium (4-11 lbs)" },
      { "maxGrams": 15000, "price": 19.99, "label": "Heavy (11-33 lbs)" },
      { "maxGrams": null, "price": 29.99, "label": "Extra Heavy (33+ lbs)" }
    ],
    "unknownWeightRate": 7.99,
    "flatRateShipping": 4.99
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
