insert into public.mi_discount_codes (code, type, value, is_active, min_order_amount)
values ('SAVE10', 'percentage', 10, true, 0)
on conflict (code)
do update set
  type = excluded.type,
  value = excluded.value,
  is_active = excluded.is_active,
  min_order_amount = excluded.min_order_amount;
