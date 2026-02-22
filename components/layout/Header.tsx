'use client';

import React, { useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, ShoppingCart, ChevronDown, Menu, X, ChevronRight, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/providers/CartProvider';
import { cn } from '@/lib/utils';
import { AnnouncementBar } from '@/components/storefront/AnnouncementBar';
import { SearchBar } from '@/components/storefront/SearchBar';
import { MegaMenu } from '@/components/storefront/MegaMenu';
import { CartPreview } from '@/components/storefront/CartPreview';
import { useCategories } from '@/components/providers/CategoriesProvider';
import { useAuth } from '@/components/providers/AuthProvider';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);
  const [mobileQuery, setMobileQuery] = useState('');
  const { categories: mobileCategories } = useCategories();
  const { user } = useAuth();
  const { itemCount, openCart } = useCart();
  const megaMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (itemCount === 0) return;
    setBadgePulse(true);
    const timer = window.setTimeout(() => setBadgePulse(false), 400);
    return () => window.clearTimeout(timer);
  }, [itemCount]);

  const isAuthenticated = !!user;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!showCategories) return;
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setShowCategories(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowCategories(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showCategories]);

  useEffect(() => {
    if (showMobileMenu) {
      setShowCategories(false);
    }
  }, [showMobileMenu]);

  return (
    <header className="sticky top-0 z-40">
      <AnnouncementBar />

      <div
        className={cn(
          'bg-white transition-all duration-300',
          isScrolled && 'shadow-md backdrop-blur-lg bg-white/95'
        )}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 -ml-2"
              aria-label="Menu"
            >
              {showMobileMenu ? (
                <X className="w-6 h-6 text-warm-700" />
              ) : (
                <Menu className="w-6 h-6 text-warm-700" />
              )}
            </button>

            <Link href="/" className="flex-shrink-0">
              <Image
                src="/TransparentLogo.png"
                alt="MooreItems"
                width={630}
                height={216}
                className="h-8 sm:h-10 lg:h-24 w-auto"
                priority
              />
            </Link>

            <nav className="hidden md:flex items-center gap-6 lg:gap-8">
              <Link
                href="/new-arrivals"
                className="relative text-sm font-medium text-warm-700 hover:text-navy-900 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold-500 after:transition-all after:duration-300 hover:after:w-full"
              >
                New Arrivals
              </Link>

              <div className="relative flex items-center gap-1" ref={megaMenuRef}>
                <Link
                  href="/shop"
                  className="relative text-sm font-medium text-warm-700 hover:text-navy-900 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold-500 after:transition-all after:duration-300 hover:after:w-full"
                >
                  Shop
                </Link>
                <button
                  className="p-1 rounded-md text-warm-700 hover:text-navy-900 hover:bg-warm-50 transition-colors"
                  onClick={() => setShowCategories((current) => !current)}
                  aria-expanded={showCategories}
                  aria-haspopup="true"
                  aria-label="Toggle shop categories"
                >
                  <ChevronDown
                    className={cn(
                      'w-4 h-4 transition-transform duration-300',
                      showCategories && 'rotate-180'
                    )}
                  />
                </button>
                <MegaMenu open={showCategories} onClose={() => setShowCategories(false)} />
              </div>

              <Link
                href="/trending"
                className="relative text-sm font-medium text-warm-700 hover:text-navy-900 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold-500 after:transition-all after:duration-300 hover:after:w-full"
              >
                Trending
              </Link>

              <Link
                href="/deals"
                className="relative text-sm font-medium text-warm-700 hover:text-navy-900 transition-colors after:absolute after:-bottom-1 after:left-0 after:h-[2px] after:w-0 after:bg-gold-500 after:transition-all after:duration-300 hover:after:w-full"
              >
                Deals
              </Link>
            </nav>

            <div className="flex items-center gap-2 sm:gap-4">
              <SearchBar />

              <Link
                href={isAuthenticated ? '/account' : '/login'}
                className="hidden sm:block p-2 rounded-lg hover:bg-warm-50 transition-colors"
                aria-label="Account"
              >
                <User className="w-5 h-5 text-warm-700" />
              </Link>

              <div className="relative">
                <button
                  onClick={openCart}
                  className="relative p-2 rounded-lg hover:bg-warm-50 transition-colors"
                  aria-label="Shopping cart"
                >
                  <ShoppingCart className="w-5 h-5 text-warm-700" />
                  {itemCount > 0 && (
                    <span
                      className={cn(
                        'absolute -top-1 -right-1 w-5 h-5 bg-gold-500 text-white text-xs font-bold rounded-full flex items-center justify-center',
                        badgePulse && 'animate-scale-bounce'
                      )}
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </span>
                  )}
                </button>
                <CartPreview open={showCartPreview} onClose={() => setShowCartPreview(false)} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {showMobileMenu && (
        <div className="md:hidden fixed inset-0 z-50 bg-navy-950 text-white">
          <div className="absolute inset-0" onClick={() => setShowMobileMenu(false)} />
          <div className="relative ml-auto h-full w-full bg-navy-900 p-6 animate-slide-in-right overflow-y-auto">
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-playfair text-gold-400">Menu</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 rounded-full hover:bg-white/10"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!mobileQuery.trim()) return;
                router.push(`/search?q=${encodeURIComponent(mobileQuery.trim())}`);
                setShowMobileMenu(false);
              }}
              className="mb-8"
            >
              <label className="text-xs uppercase tracking-widest text-warm-300 mb-3 block">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-300" />
                <input
                  value={mobileQuery}
                  onChange={(event) => setMobileQuery(event.target.value)}
                  placeholder="Search products..."
                  className="w-full rounded-xl bg-white/10 border border-white/15 pl-9 pr-3 py-3 text-sm text-white placeholder:text-warm-300 focus:outline-none focus:ring-2 focus:ring-gold-500/50"
                />
              </div>
            </form>

            <nav className="space-y-6">
              <Link
                href={isAuthenticated ? '/account' : '/login'}
                className="block text-base font-semibold text-white hover:text-gold-400"
                onClick={() => setShowMobileMenu(false)}
              >
                {isAuthenticated ? 'My Account' : 'Sign In'}
              </Link>
              <Link
                href="/new-arrivals"
                className="block text-base font-semibold text-white hover:text-gold-400"
                onClick={() => setShowMobileMenu(false)}
              >
                New Arrivals
              </Link>
              <Link
                href="/shop"
                className="block text-base font-semibold text-white hover:text-gold-400"
                onClick={() => setShowMobileMenu(false)}
              >
                Shop All
              </Link>
              <Link
                href="/trending"
                className="block text-base font-semibold text-white hover:text-gold-400"
                onClick={() => setShowMobileMenu(false)}
              >
                Trending
              </Link>
              <Link
                href="/deals"
                className="block text-base font-semibold text-white hover:text-gold-400"
                onClick={() => setShowMobileMenu(false)}
              >
                Deals
              </Link>
              <Link
                href="/search"
                className="block text-base font-semibold text-white hover:text-gold-400"
                onClick={() => setShowMobileMenu(false)}
              >
                Search
              </Link>
              <div>
                <p className="text-xs uppercase tracking-widest text-warm-300 mb-3">
                  Categories
                </p>
                <div className="space-y-3">
                  {mobileCategories.map((category) => (
                    <Link
                      key={category.id}
                      href={`/category/${category.slug}`}
                      className="flex items-center justify-between text-base text-white hover:text-gold-400"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      <span>{category.name}</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
