'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, Shirt, Home, Gem, PawPrint } from 'lucide-react';
import { CustomButton } from '@/components/ui/custom-button';
import { cn } from '@/lib/utils';

interface HeroSlide {
  id: number;
  badge: string;
  title: string;
  subtitle: string;
  primaryCta: { text: string; href: string };
  secondaryCta: { text: string; href: string };
}

const slides: HeroSlide[] = [
  {
    id: 1,
    badge: 'New arrivals added this week',
    title: 'Discover What\'s\nTrending Now',
    subtitle: 'Curated collections that capture the moment',
    primaryCta: { text: 'Shop Trending', href: '/trending' },
    secondaryCta: { text: 'View All', href: '/new-arrivals' },
  },
  {
    id: 2,
    badge: 'Transform your space',
    title: 'Your Home,\nElevated',
    subtitle: 'Discover premium home & garden essentials',
    primaryCta: { text: 'Explore Home', href: '/category/home-garden' },
    secondaryCta: { text: 'Shop Now', href: '/category/home-garden' },
  },
  {
    id: 3,
    badge: 'Premium quality, great prices',
    title: 'Beauty That\nDelivers',
    subtitle: 'Shop health & beauty products you\'ll love',
    primaryCta: { text: 'Shop Beauty', href: '/category/health-beauty' },
    secondaryCta: { text: 'Explore All', href: '/category/health-beauty' },
  },
];

export function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  const slide = slides[currentSlide];

  return (
    <section className="relative bg-hero-gradient overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 right-20 w-96 h-96 bg-gold-500 rounded-full opacity-[0.06] blur-3xl" />
        <div className="absolute bottom-20 left-20 w-80 h-80 bg-gold-500 rounded-full opacity-[0.04] blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(90deg, rgba(200,164,94,0.3) 1px, transparent 1px), linear-gradient(rgba(200,164,94,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24 lg:py-32">
        <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div
              key={`badge-${slide.id}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500/15 border border-gold-500/30 rounded-full text-gold-400 text-sm font-medium mb-6 animate-fadeUp"
            >
              <Sparkles className="w-4 h-4" />
              {slide.badge}
            </div>

            <h1
              key={`title-${slide.id}`}
              className="text-4xl sm:text-5xl lg:text-[58px] font-playfair font-bold text-white leading-[1.1] tracking-tight mb-6 whitespace-pre-line animate-fadeUp"
              style={{ animationDelay: '100ms' }}
            >
              {slide.title}
            </h1>

            <p
              key={`subtitle-${slide.id}`}
              className="text-base sm:text-lg text-navy-200 mb-8 max-w-xl mx-auto lg:mx-0 animate-fadeUp"
              style={{ animationDelay: '200ms' }}
            >
              {slide.subtitle}
            </p>

            <div
              key={`cta-${slide.id}`}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 animate-fadeUp"
              style={{ animationDelay: '300ms' }}
            >
              <CustomButton variant="primary" size="lg" asChild>
                <Link href={slide.primaryCta.href}>
                  {slide.primaryCta.text}
                </Link>
              </CustomButton>
              <CustomButton variant="ghost" size="lg" asChild>
                <Link href={slide.secondaryCta.href}>
                  {slide.secondaryCta.text}
                </Link>
              </CustomButton>
            </div>

            <div className="flex items-center justify-center lg:justify-start gap-2 mt-12">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    'h-2 rounded-full transition-all duration-300',
                    currentSlide === index
                      ? 'w-8 bg-gold-500'
                      : 'w-2 bg-navy-400 hover:bg-navy-300'
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="hidden lg:block relative">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/10 to-transparent rounded-full blur-3xl" />
            <div className="relative grid grid-cols-2 gap-4">
              {[
                { icon: Shirt, label: "Women's Fashion", iconColor: 'text-rose-400' },
                { icon: Home, label: 'Home & Garden', iconColor: 'text-emerald-400' },
                { icon: Sparkles, label: 'Health & Beauty', iconColor: 'text-amber-400' },
                { icon: Gem, label: 'Jewelry', iconColor: 'text-violet-400' },
              ].map((cat, i) => {
                const Icon = cat.icon;
                return (
                  <div
                    key={cat.label}
                    className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 hover:bg-white/15 transition-all duration-300 animate-float"
                    style={{
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: `${3 + i * 0.3}s`,
                    }}
                  >
                    <div className="w-10 h-10 mb-3 rounded-xl bg-white/10 flex items-center justify-center">
                      <Icon className={cn('w-5 h-5', cat.iconColor)} strokeWidth={1.75} />
                    </div>
                    <p className="text-sm font-semibold text-white">{cat.label}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
