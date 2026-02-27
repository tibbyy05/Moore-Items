import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search | MooreItems',
  description: 'Search thousands of curated products at MooreItems. Find exactly what you need.',
  alternates: { canonical: '/search' },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
