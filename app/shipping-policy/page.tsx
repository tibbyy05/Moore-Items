import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Shipping Policy | MooreItems',
  description: 'Free shipping on orders over $50. US warehouse orders ship in 2-5 business days. Learn about our shipping options.',
  alternates: { canonical: '/shipping-policy' },
};

export default function ShippingPolicyPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6">
            Shipping Policy
          </h1>
          <div className="space-y-5 text-warm-700 leading-relaxed">
            <p>All orders ship from US warehouses.</p>
            <p>Estimated delivery: 2-5 business days.</p>
            <p>Free shipping on orders over $50.</p>
            <p>Standard shipping: $4.99.</p>
            <p>Processing time: 1-2 business days.</p>
            <p>Tracking provided via email once your order ships.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
