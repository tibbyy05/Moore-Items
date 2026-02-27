import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop All Products | MooreItems',
  description: 'Browse thousands of curated products across fashion, home, beauty, electronics and more. Free shipping on orders over $50.',
  alternates: { canonical: '/shop' },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return children;
}
