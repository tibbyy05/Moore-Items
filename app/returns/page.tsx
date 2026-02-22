import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ReturnsPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6">
            Returns &amp; Refunds
          </h1>
          <div className="space-y-5 text-warm-700 leading-relaxed">
            <p>We offer a 30-day return policy on all orders.</p>
            <p>Items must be unused and in original packaging.</p>
            <p>Contact support to initiate a return.</p>
            <p>Refunds are processed within 5-7 business days.</p>
            <p>Damaged or defective items are replaced at no charge.</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
