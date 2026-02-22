import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-6">
            Contact Us
          </h1>
          <p className="text-warm-700 mb-8">
            Email us at support@mooreitems.com. Response time: within 24 hours.
          </p>
          <form className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">Name</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">Subject</label>
              <input
                type="text"
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">Message</label>
              <textarea
                rows={6}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Write your message..."
              />
            </div>
            <button
              type="button"
              className="px-6 py-3 rounded-lg bg-gold-500 text-white font-semibold hover:bg-gold-600 transition"
            >
              Send Message
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
