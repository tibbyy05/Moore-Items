import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending Products | MooreItems',
  description: 'Discover the most popular products trending now at MooreItems. Free shipping on orders over $50.',
  alternates: { canonical: '/trending' },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
