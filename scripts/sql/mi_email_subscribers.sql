-- Create email subscribers table
create table if not exists public.mi_email_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  source text default 'popup',
  subscribed_at timestamptz default now(),
  is_active boolean default true
);

-- Ensure WELCOME10 discount code exists
insert into public.mi_discount_codes (code, type, value, is_active, min_order_amount)
values ('WELCOME10', 'percentage', 10, true, 0)
on conflict (code)
do update set
  type = excluded.type,
  value = excluded.value,
  is_active = excluded.is_active,
  min_order_amount = excluded.min_order_amount;
