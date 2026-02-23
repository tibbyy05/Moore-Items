-- Digital Products: add file path column and "Digital Downloads" category
-- When digital_file_path has a value, the product is a digital download.
-- The value stores the Supabase Storage object path (e.g., "uuid-filename.pdf").

ALTER TABLE mi_products ADD COLUMN IF NOT EXISTS digital_file_path TEXT DEFAULT NULL;

INSERT INTO mi_categories (name, slug, icon_name, icon_color, icon_gradient, is_active, sort_order)
VALUES (
  'Digital Downloads',
  'digital-downloads',
  'Download',
  'text-violet-500',
  'from-violet-100 to-purple-50',
  true,
  99
)
ON CONFLICT (slug) DO NOTHING;
