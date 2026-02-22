'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { CustomButton } from '@/components/ui/custom-button';
import { cn } from '@/lib/utils';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  cta: { label: string; href: string };
  secondary: { label: string; href: string };
  image: string;
}

const slides: Slide[] = [
  {
    id: 1,
    title: 'Curated finds for\nmodern living',
    subtitle: 'Discover new arrivals handpicked for style, comfort, and value.',
    cta: { label: 'Shop New Arrivals', href: '/new-arrivals' },
    secondary: { label: 'Browse Categories', href: '/category/home-garden' },
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 2,
    title: 'Trending essentials,\nready to ship',
    subtitle: 'Best-sellers and fresh drops updated daily.',
    cta: { label: 'Shop Trending', href: '/trending' },
    secondary: { label: 'Explore Deals', href: '/deals' },
    image:
      'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=1600&auto=format&fit=crop',
  },
  {
    id: 3,
    title: 'Elevate every room\nwith ease',
    subtitle: 'Home & garden picks that feel premium without the premium price.',
    cta: { label: 'Shop Home', href: '/category/home-garden' },
    secondary: { label: 'See All', href: '/new-arrivals' },
    image:
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=1600&auto=format&fit=crop',
  },
];

export function HeroSlider() {
  const [current, setCurrent] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setOffset(window.scrollY * 0.5);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <section className="relative overflow-hidden bg-navy-950 text-white">
      <div className="absolute inset-0">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={cn(
              'absolute inset-0 bg-cover bg-center transition-opacity duration-700 will-change-transform',
              index === current ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              backgroundImage: `linear-gradient(120deg, rgba(10,14,26,0.8), rgba(10,14,26,0.2)), url(${slide.image})`,
              transform: `translateY(${offset}px)`,
            }}
          />
        ))}
        {/* TODO: Replace with custom hero imagery */}
      </div>

      <div className="relative max-w-7xl mx-auto px-4 py-20 sm:py-28">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.2em] text-gold-300 mb-4">
            MooreItems Collection
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-playfair font-semibold leading-tight mb-6 whitespace-pre-line">
            {slides[current].title}
          </h1>
          <p className="text-base sm:text-lg text-navy-200 mb-8">
            {slides[current].subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <CustomButton variant="primary" size="lg" asChild>
              <Link href={slides[current].cta.href}>{slides[current].cta.label}</Link>
            </CustomButton>
            <CustomButton variant="secondary" size="lg" asChild>
              <Link href={slides[current].secondary.href}>{slides[current].secondary.label}</Link>
            </CustomButton>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                current === index ? 'w-8 bg-gold-500' : 'w-2 bg-navy-400 hover:bg-navy-300'
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
