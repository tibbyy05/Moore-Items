create table if not exists mi_settings (
  key text primary key,
  value text,
  updated_at timestamptz default now()
);
