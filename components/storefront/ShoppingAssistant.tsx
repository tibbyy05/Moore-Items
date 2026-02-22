'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { StarRating } from '@/components/ui/star-rating';
import { cn } from '@/lib/utils';

declare global {
  interface Window {
    __miAssistantMounted?: boolean;
  }
}

type AssistantProduct = {
  name: string;
  price: number;
  slug: string;
  image: string;
  rating: number;
};

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  products?: AssistantProduct[];
};

const WELCOME_MESSAGE =
  "Hi! 👋 I'm your personal shopping assistant. Tell me what you're looking for and I'll find the perfect products for you. Try asking: \"Gift ideas for my mom under $50\" or \"Best pet supplies for a new puppy\"";
const QUICK_PROMPTS = [
  'Gift ideas under $50',
  'Best pet supplies',
  'Trending fashion',
  'Kitchen essentials',
];

export function ShoppingAssistant() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [shouldPulse, setShouldPulse] = useState(false);
  const [shouldRender, setShouldRender] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.__miAssistantMounted) {
      setShouldRender(false);
      return;
    }
    window.__miAssistantMounted = true;
    return () => {
      window.__miAssistantMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = sessionStorage.getItem('mi_assistant_open');
    setOpen(stored === 'true');

    const pulsed = sessionStorage.getItem('mi_assistant_pulsed');
    if (!pulsed) {
      setShouldPulse(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem('mi_assistant_open', open ? 'true' : 'false');
    if (open) {
      sessionStorage.setItem('mi_assistant_pulsed', 'true');
      setShouldPulse(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, open]);

  if (!shouldRender) return null;

  const sendMessage = async (override?: string) => {
    const trimmed = (override ?? input).trim();
    if (!trimmed || loading) return;

    const nextMessages = [...messages, { role: 'user', content: trimmed }].slice(-10);
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: nextMessages.map((msg) => ({ role: msg.role, content: msg.content })),
        }),
      });

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data?.message || 'Here are a few options to consider.',
        products: Array.isArray(data?.products) ? data.products : [],
      };
      setMessages((current) => [...current, assistantMessage].slice(-10));
    } catch {
      setMessages((current) =>
        [
          ...current,
          {
            role: 'assistant',
            content:
              'Sorry — I had trouble finding products just now. Try another request or different keywords.',
          },
        ].slice(-10)
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full shadow-xl flex items-center justify-center',
          'bg-[#c8a45e] text-white transition-transform hover:scale-105',
          shouldPulse && !open && 'animate-pulse'
        )}
        aria-label="Open shopping assistant"
      >
        <Sparkles className="w-6 h-6" />
      </button>

      <div
        className={cn(
          'fixed z-50 bg-white shadow-2xl border border-warm-200 overflow-hidden flex flex-col',
          'transition-all duration-200',
          'inset-0 sm:inset-auto sm:bottom-6 sm:right-6',
          'w-full h-full sm:w-[400px] sm:h-[500px] sm:rounded-2xl',
          open ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none translate-y-4'
        )}
      >
        <div className="bg-navy-950 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="sm:hidden p-1 rounded-full hover:bg-white/10"
              aria-label="Close assistant"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold-300" />
                <span className="font-semibold">Shopping Assistant</span>
              </div>
            <span className="text-xs text-white/70">
              Powered by{' '}
              <a
                href="https://ai-genda.com"
                target="_blank"
                rel="noopener noreferrer"
                className="underline-offset-2 hover:underline"
              >
                Ai-genda.com
              </a>
            </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="hidden sm:inline-flex p-1 rounded-full hover:bg-white/10"
            aria-label="Close assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-gold-600">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="max-w-[85%] space-y-3">
              <div className="bg-warm-50 text-warm-800 px-4 py-3 rounded-2xl text-sm leading-relaxed">
                {WELCOME_MESSAGE}
              </div>
              {messages.length === 0 && (
                <div className="flex flex-wrap gap-2">
                  {QUICK_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => sendMessage(prompt)}
                      className="px-3 py-1.5 rounded-full bg-white border border-warm-200 text-xs text-warm-700 hover:border-gold-500 hover:text-gold-600 transition-colors"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={cn('flex', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div className={cn(message.role === 'user' ? 'max-w-[85%]' : 'w-full')}>
                <div
                  className={cn(
                    'px-4 py-3 rounded-2xl text-sm leading-relaxed',
                    message.role === 'user'
                      ? 'bg-[#c8a45e] text-white'
                      : 'bg-warm-50 text-warm-800'
                  )}
                >
                  {message.content}
                </div>
                {message.role === 'assistant' && message.products && message.products.length > 0 && (
                  <div className="mt-3 space-y-3">
                    {message.products.map((product) => (
                      <div
                        key={product.slug}
                        className="w-full flex items-center gap-3 p-3 border border-warm-200 rounded-xl bg-white"
                      >
                        <div className="relative w-12 h-12 rounded-md overflow-hidden bg-warm-50 flex-shrink-0">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                              unoptimized
                            />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-warm-900 line-clamp-2">
                            {product.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-warm-900">
                              ${Number(product.price || 0).toFixed(2)}
                            </span>
                            <StarRating rating={product.rating || 0} size="sm" />
                            {product.rating ? (
                              <span className="text-xs font-semibold text-gold-600">
                                ★ {Number(product.rating || 0).toFixed(1)}
                              </span>
                            ) : null}
                          </div>
                          <Link
                            href={`/product/${product.slug}`}
                            className="text-xs font-semibold text-gold-600 hover:text-gold-700 inline-flex items-center gap-1 mt-1"
                          >
                            View Product
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-warm-100 flex items-center justify-center text-gold-600">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div className="bg-warm-50 px-4 py-3 rounded-2xl text-sm text-warm-700">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce" />
                  <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce delay-150" />
                  <span className="w-2 h-2 bg-gold-400 rounded-full animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-warm-200 p-3 bg-white sticky bottom-0 pb-[env(safe-area-inset-bottom)]">
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Ask about gifts, deals, or categories..."
              className="flex-1 px-4 py-2 border border-warm-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-gold-500"
              disabled={loading}
            />
            <button
              type="button"
              onClick={sendMessage}
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-white',
                'bg-[#c8a45e] hover:bg-gold-600 transition-colors',
                loading && 'opacity-60 cursor-not-allowed'
              )}
              disabled={loading}
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
