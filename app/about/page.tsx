import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6">
            About MooreItems
          </h1>
          <p className="text-warm-700 leading-relaxed mb-6">
            MooreItems is a curated online marketplace offering 3,000+ quality products with free
            US shipping. We were founded on the belief that great products shouldn&apos;t come with
            premium prices.
          </p>
          <div className="space-y-6">
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
                <li>Quality: Curated products that meet our standards.</li>
                <li>Value: Fair pricing without the premium markup.</li>
                <li>Fast Shipping: Reliable 2-5 day delivery from US warehouses.</li>
              </ul>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
