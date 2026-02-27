import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Today's Deals | MooreItems",
  description: 'Save big on limited-time deals across fashion, home, electronics and more. Free shipping on orders over $50.',
  alternates: { canonical: '/deals' },
};

export default function DealsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
