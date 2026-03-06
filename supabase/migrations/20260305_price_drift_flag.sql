alter table mi_products
  add column if not exists price_drift_flagged boolean not null default false;

alter table mi_products
  add column if not exists price_drift_details jsonb;
