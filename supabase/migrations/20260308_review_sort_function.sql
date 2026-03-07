-- Function to fetch paginated reviews with customer reviews sorted first
CREATE OR REPLACE FUNCTION get_product_reviews(
  p_product_id UUID,
  p_limit INT DEFAULT 10,
  p_offset INT DEFAULT 0,
  p_sort TEXT DEFAULT 'newest'
)
RETURNS TABLE (
  id UUID,
  rating INT,
  body TEXT,
  customer_name TEXT,
  source TEXT,
  verified_purchase BOOLEAN,
  created_at TIMESTAMPTZ,
  total_count BIGINT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    r.id,
    r.rating,
    r.body,
    r.customer_name,
    r.source,
    r.verified_purchase,
    r.created_at,
    COUNT(*) OVER() AS total_count
  FROM mi_reviews r
  WHERE r.product_id = p_product_id
    AND r.is_approved = true
  ORDER BY
    CASE WHEN r.source = 'customer' THEN 0 ELSE 1 END ASC,
    CASE WHEN p_sort = 'newest' THEN r.created_at END DESC,
    CASE WHEN p_sort != 'newest' THEN r.created_at END ASC
  LIMIT p_limit
  OFFSET p_offset;
$$;
