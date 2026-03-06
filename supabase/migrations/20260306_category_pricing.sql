-- Category-level pricing overrides table
CREATE TABLE IF NOT EXISTS mi_category_pricing (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  category_slug text NOT NULL UNIQUE,
  category_name text NOT NULL,
  min_price decimal(10,2) DEFAULT NULL,
  target_margin decimal(5,4) DEFAULT NULL,
  markup_override decimal(5,2) DEFAULT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed default rules for all 12 categories
INSERT INTO mi_category_pricing (category_slug, category_name, min_price, target_margin) VALUES
  ('jewelry', 'Jewelry', 7.99, 0.20),
  ('fashion', 'Fashion', 9.99, 0.18),
  ('health-beauty', 'Health & Beauty', 6.99, 0.18),
  ('home-furniture', 'Home & Furniture', 12.99, 0.15),
  ('kitchen-dining', 'Kitchen & Dining', 9.99, 0.15),
  ('garden-outdoor', 'Garden & Outdoor', 12.99, 0.15),
  ('electronics', 'Electronics', 14.99, 0.18),
  ('kids-toys', 'Kids & Toys', 7.99, 0.18),
  ('pet-supplies', 'Pet Supplies', 6.99, 0.18),
  ('sports-outdoors', 'Sports & Outdoors', 9.99, 0.15),
  ('storage-organization', 'Storage & Organization', 7.99, 0.15),
  ('tools-hardware', 'Tools & Hardware', 9.99, 0.15)
ON CONFLICT (category_slug) DO NOTHING;
