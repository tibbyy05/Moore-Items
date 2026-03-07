'use client';

import { useState, type FormEvent } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setIsSuccess(false);
    setIsLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setIsSuccess(true);
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  }

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

          {isSuccess && (
            <div className="mb-6 p-4 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm font-medium">
              Message sent! We'll get back to you within 24 hours.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm font-medium">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">Name</label>
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">Email</label>
              <input
                type="email"
                name="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">Subject</label>
              <input
                type="text"
                name="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="How can we help?"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-warm-900 mb-2">Message</label>
              <textarea
                name="message"
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-warm-200 focus:outline-none focus:ring-2 focus:ring-gold-500"
                placeholder="Write your message..."
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 rounded-lg bg-gold-500 text-white font-semibold hover:bg-gold-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
