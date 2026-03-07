ALTER TABLE mi_orders
  ADD COLUMN refund_status text,          -- 'refunded' | null
  ADD COLUMN refunded_at   timestamptz,
  ADD COLUMN stripe_refund_id text;
