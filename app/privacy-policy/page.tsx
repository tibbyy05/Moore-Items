import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'Privacy Policy | MooreItems',
  description: 'Learn how MooreItems collects, uses, and protects your personal information.',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6">
            Privacy Policy
          </h1>
          <div className="space-y-5 text-warm-700 leading-relaxed">
            <p>
              This Privacy Policy explains how MooreItems collects, uses, and protects your
              information when you visit MooreItems.com.
            </p>
            <p>
              We collect information you provide during checkout, account creation, or support
              requests. We use this information to process orders, provide support, and improve the
              shopping experience.
            </p>
            <p>
              We do not sell your personal information. We may share data with trusted service
              providers to operate our website and fulfill orders.
            </p>
            <p>
              You can contact us at support@mooreitems.com with any privacy questions or requests.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
