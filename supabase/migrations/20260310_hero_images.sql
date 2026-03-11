-- Hero image curation table
CREATE TABLE IF NOT EXISTS mi_hero_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES mi_products(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  product_name text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_hero_images_active_order ON mi_hero_images (is_active, display_order);
