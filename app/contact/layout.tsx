import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us | MooreItems',
  description: 'Get in touch with the MooreItems team. We respond within 24 hours to all inquiries.',
  alternates: { canonical: '/contact' },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
