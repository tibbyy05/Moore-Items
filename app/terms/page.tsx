import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6">
            Terms of Service
          </h1>
          <div className="space-y-5 text-warm-700 leading-relaxed">
            <p>
              These Terms of Service govern your use of MooreItems.com. By accessing or purchasing
              from MooreItems, you agree to these terms.
            </p>
            <p>
              All prices and availability are subject to change without notice. We reserve the
              right to refuse or cancel orders at our discretion.
            </p>
            <p>
              You are responsible for providing accurate shipping and contact information at
              checkout. MooreItems is not liable for delays caused by incorrect information.
            </p>
            <p>
              For questions about these terms, contact support@mooreitems.com.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
