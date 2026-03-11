-- Add per-slot assignment to hero images and drop display_order
ALTER TABLE mi_hero_images ADD COLUMN slot integer NOT NULL DEFAULT 1;
ALTER TABLE mi_hero_images ADD CONSTRAINT mi_hero_images_slot_check CHECK (slot >= 1 AND slot <= 4);
ALTER TABLE mi_hero_images DROP COLUMN IF EXISTS display_order;

-- Replace old index with slot-aware index
DROP INDEX IF EXISTS idx_hero_images_active_order;
CREATE INDEX idx_hero_images_slot_active ON mi_hero_images (slot, is_active, created_at);
