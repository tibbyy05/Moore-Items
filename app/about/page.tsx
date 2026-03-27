import type { Metadata } from 'next';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'About Us | MooreItems',
  description: 'Moore Items is a curated online retail store based in Fort Lauderdale, Florida, offering 3,000+ quality products across home, fashion, electronics, and more.',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6">
            About Moore Items
          </h1>
          <p className="text-warm-700 leading-relaxed mb-6">
            Moore Items is a curated online retail store based in Fort Lauderdale, Florida,
            offering 3,000+ quality products across home, fashion, electronics, and more. We
            source products from trusted suppliers and ship directly to customers across the
            United States.
          </p>
          <div className="space-y-6">
            <section>
              <h2 className="text-xl font-playfair font-semibold text-warm-900 mb-2">
                Our Story
              </h2>
              <p className="text-warm-700 leading-relaxed">
                Moore Items was founded with a simple idea: make it easy to find great products
                at fair prices, without the hassle of big-box retail. Every product in our
                catalog is hand-picked to meet our standards for quality and value.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-playfair font-semibold text-warm-900 mb-2">
                How It Works
              </h2>
              <p className="text-warm-700 leading-relaxed">
                We partner with vetted suppliers to bring you a wide selection of products
                &mdash; from home furnishings to fashion accessories. When you place an order,
                we handle everything from payment processing to coordinating fulfillment and
                shipping directly to your door.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-playfair font-semibold text-warm-900 mb-2">
                Our Mission
              </h2>
              <p className="text-warm-700 leading-relaxed">
                Deliver a premium shopping experience with thoughtfully selected products, fast
                delivery, and unbeatable value.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-playfair font-semibold text-warm-900 mb-2">
                Our Values
              </h2>
              <ul className="list-disc list-inside text-warm-700 space-y-1">
                <li>Quality: Every product is reviewed before it joins our catalog.</li>
                <li>Value: Fair pricing without inflated markups.</li>
                <li>Fast Shipping: 2&ndash;5 day US warehouse delivery on most items.</li>
                <li>Customer Service: Reach us anytime through our Contact page.</li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-playfair font-semibold text-warm-900 mb-2">
                Business Information
              </h2>
              <ul className="text-warm-700 space-y-1">
                <li><span className="font-medium text-warm-800">Business name:</span> Moore Items</li>
                <li><span className="font-medium text-warm-800">Location:</span> Fort Lauderdale, Florida, United States</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
