import { CartItem } from '@/lib/types';

export function calculateShipping(items: CartItem[]): number {
  const hasCNItem = items.some((item) => item.warehouse === 'CN');
  const hasCAItem = items.some((item) => item.warehouse === 'CA');
  const hasUSItem = items.some((item) => item.warehouse === 'US');

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (subtotal >= 50) return 0;
  if ((hasCNItem || hasCAItem) && hasUSItem) return 8.99;
  if (hasCNItem || hasCAItem) return 6.99;
  return 4.99;
}
