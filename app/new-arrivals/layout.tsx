import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'New Arrivals | MooreItems',
  description: 'Shop the latest new arrivals at MooreItems. Fresh products added daily. Free shipping on orders over $50.',
  alternates: { canonical: '/new-arrivals' },
};

export default function NewArrivalsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
