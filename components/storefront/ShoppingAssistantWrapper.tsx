'use client';

import dynamic from 'next/dynamic';

const ShoppingAssistant = dynamic(
  () => import('@/components/storefront/ShoppingAssistant').then((mod) => mod.ShoppingAssistant),
  { ssr: false }
);

export function ShoppingAssistantWrapper() {
  return <ShoppingAssistant />;
}
