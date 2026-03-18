'use client';

import React, { useEffect, useRef, useState, startTransition } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, ChevronDown } from 'lucide-react';
import { useCart } from '@/components/providers/CartProvider';
import { CartDrawer } from '@/components/cart/CartDrawer';

/* ─── Types ──────────────────────────────────────────────────── */

interface DiscountTier {
  qty: number;
  label: string;
  discount_pct: number;
  badge: string;
}

interface LandingPageProps {
  page: {
    id: string;
    name: string;
    slug: string;
    headline: string;
    subheadline: string;
    sections: any;
    quantity_discounts: DiscountTier[];
    promo_codes: Record<string, string> | null;
    hero_image_url?: string | null;
    meta_title: string;
    meta_description: string;
  };
  product: {
    id: string;
    name: string;
    retail_price: number;
    images: string[];
    description: string;
    slug: string;
    warehouse: string;
    warehouse_status?: string | null;
    shipping_days?: string | null;
    delivery_time?: string | null;
    shipping_estimate?: string | null;
    video_url?: string | null;
    videos?: Array<{
      cloudflare_id: string;
      url: string;
      status: 'processing' | 'ready';
      thumbnail: string;
      sort_order: number;
    }> | null;
    mi_categories: { name: string; slug: string } | null;
    mi_product_variants: Array<{
      id: string;
      name: string;
      color: string | null;
      size: string | null;
      retail_price: number;
      stock_count: number;
      image_url: string | null;
      is_active?: boolean;
    }> | null;
  };
}

/* ─── Colors ─────────────────────────────────────────────────── */

const NAVY = '#0f1629';
const GOLD = '#c8a45e';
const CREAM = '#f7f6f3';

/* ─── Smooth scroll helper ───────────────────────────────────── */

function scrollToSelector() {
  document.getElementById('quantity-selector')?.scrollIntoView({ behavior: 'smooth' });
}

/* ─── Component ──────────────────────────────────────────────── */

export function LandingPageClient({ page, product }: LandingPageProps) {
  const { addItem, itemCount, openCart } = useCart();
  const sections = page.sections || {};
  console.log('[LP Sections]', JSON.stringify({
    whats_included_enabled: sections?.whats_included_enabled,
    whats_included_count: sections?.whats_included?.length,
  }));
  const tiers: DiscountTier[] = page.quantity_discounts || [];
  const allVariants = product.mi_product_variants || [];
  // Defensive filter: only show active variants even if API didn't filter
  const variants = allVariants.filter((v) => v.is_active !== false);
  // On landing pages, exclude multi-unit variants (e.g. "2pcs") — those are sold via bundle qty tiers instead
  const lpVariants = variants.filter((v) => (!v.size || v.size === '1pc') && v.color !== 'White Pink');

  // Available color options from lpVariants
  const colorOptions = Array.from(new Set(lpVariants.filter((v) => v.color).map((v) => v.color!))).map((c) => {
    const variant = lpVariants.find((v) => v.color === c)!;
    return { color: c, variant, basePrice: variant.retail_price };
  });
  const defaultColor = colorOptions[0]?.color || 'White';

  // Qty-first state
  const [selectedQty, setSelectedQty] = useState(1);
  const [unitColors, setUnitColors] = useState<string[]>([defaultColor]);
  const [addedToCart, setAddedToCart] = useState(false);

  const selectTier = (qty: number) => {
    setSelectedQty(qty);
    setUnitColors(Array(qty).fill(defaultColor));
  };

  const setUnitColor = (index: number, color: string) => {
    setUnitColors((prev) => prev.map((c, i) => i === index ? color : c));
  };

  // Active discount tier
  const activeTier = tiers.find((t) => t.qty === selectedQty) || null;
  const discountPct = activeTier?.discount_pct || 0;
  const discountedPrice = (base: number) => Math.round(base * (1 - discountPct / 100) * 100) / 100;

  // Order total: sum of discounted price per unit
  const orderTotal = Math.round(unitColors.reduce((sum, c) => {
    const opt = colorOptions.find((o) => o.color === c);
    return sum + discountedPrice(opt?.basePrice || 0);
  }, 0) * 100) / 100;

  const promoCodeKey = `qty_${selectedQty}`;
  const promoCode = page.promo_codes?.[promoCodeKey] || null;

  // Crossfade gallery state
  const galleryImgs: string[] = Array.isArray(sections.gallery_images) && sections.gallery_images.length > 0
    ? sections.gallery_images
    : product.images || [];
  const [galleryBase, setGalleryBase] = useState(galleryImgs[0] || '');
  const [galleryNext, setGalleryNext] = useState<string | null>(null);
  const [fadeIn, setFadeIn] = useState(false);
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleGallerySelect = (img: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (img === galleryBase && !galleryNext) return;
    if (fadeTimer.current) clearTimeout(fadeTimer.current);
    startTransition(() => {
      setGalleryNext(img);
      setFadeIn(false);
    });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setFadeIn(true);
      });
    });
    fadeTimer.current = setTimeout(() => {
      setGalleryBase(img);
      setGalleryNext(null);
      setFadeIn(false);
    }, 420);
  };

  const activeGalleryImg = galleryNext || galleryBase;

  // Track view on mount (fire-and-forget)
  useEffect(() => {
    fetch('/api/lp/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: page.slug }),
    }).catch(() => {});
  }, [page.slug]);

  const handleAddToCart = () => {
    const bundleDiscount = discountPct > 0 && activeTier
      ? { qty: activeTier.qty, pct: activeTier.discount_pct }
      : null;
    // Group unitColors by color → count
    const colorCounts: Record<string, number> = {};
    for (const c of unitColors) colorCounts[c] = (colorCounts[c] || 0) + 1;
    for (const [color, qty] of Object.entries(colorCounts)) {
      const opt = colorOptions.find((o) => o.color === color);
      if (!opt) continue;
      addItem({
        productId: product.id,
        slug: product.slug,
        variantId: opt.variant.id,
        name: product.name,
        variantName: opt.variant.name || undefined,
        price: discountedPrice(opt.basePrice),
        originalPrice: opt.basePrice,
        bundleDiscount,
        quantity: qty,
        image: opt.variant.image_url || product.images?.[0] || '',
        warehouse: (product.warehouse || 'US') as 'US' | 'CN' | 'CA',
        warehouse_status: (product.warehouse_status as 'US' | 'CN' | 'DIGITAL') || null,
        shippingDays: product.shipping_days || null,
      });
    }
    if (promoCode) {
      localStorage.setItem('pending_promo_code', promoCode);
    }
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const cartUrl = promoCode && discountPct > 0
    ? `/cart?promo=${encodeURIComponent(promoCode)}`
    : '/cart';

  const heroImg = page.hero_image_url || product.images?.[0] || '';
  const featureImg1 = sections.feature1_image || product.images?.[1] || product.images?.[0] || '';
  const featureImg2 = sections.feature2_image || product.images?.[2] || product.images?.[1] || product.images?.[0] || '';


  return (
    <>
      <CartDrawer />

      {/* ── MINIMAL HEADER ──────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
          <Link href="/" className="font-playfair text-xl font-bold" style={{ color: NAVY }}>
            MooreItems
          </Link>
          <button
            onClick={openCart}
            className="relative p-2 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Cart"
          >
            <ShoppingCart className="w-5 h-5" style={{ color: NAVY }} />
            {itemCount > 0 && (
              <span
                className="absolute -top-1 -right-1 w-5 h-5 text-white text-xs font-bold rounded-full flex items-center justify-center"
                style={{ backgroundColor: GOLD }}
              >
                {itemCount > 9 ? '9+' : itemCount}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ── SECTION 1: HERO ─────────────────────────────────────── */}
      <section style={{ backgroundColor: NAVY }}>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-10 items-center">
            <div>
              <h1
                className="font-playfair text-4xl md:text-5xl font-bold leading-tight"
                style={{ color: CREAM }}
              >
                {sections.hero?.headline || product.name}
              </h1>
              <p className="text-lg mt-4" style={{ color: GOLD }}>
                {sections.hero?.subheadline || ''}
              </p>
              <button
                onClick={scrollToSelector}
                className="mt-8 px-8 py-3.5 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                {sections.hero?.cta_text || 'Shop Now'}
              </button>
              <p className="mt-4 text-sm" style={{ color: `${CREAM}b3` }}>
                &#10003; Free Shipping on $50+ &nbsp; &#10003; 30-Day Returns &nbsp; &#10003; Secure Checkout
              </p>
            </div>
            <div className="flex justify-center">
              {(sections.hero_video_url || product.video_url || product.videos?.[0]?.url) ? (
                <div className="relative w-full max-h-96 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
                  <video
                    src={sections.hero_video_url || product.video_url || product.videos?.[0]?.url || ''}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                </div>
              ) : heroImg ? (
                <img
                  src={heroImg}
                  alt={product.name}
                  className="rounded-xl max-h-96 object-contain"
                />
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 2: QUANTITY SELECTOR (IMMERSIVE) ────────────── */}
      <section id="quantity-selector" className="min-h-screen" style={{ backgroundColor: CREAM }}>
        <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">

          {/* Left column — fixed-height image gallery with crossfade */}
          <div className="relative h-[500px] md:h-screen overflow-hidden bg-[#f7f6f3]">
            {/* Base image layer */}
            <img
              src={galleryBase || heroImg}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ transition: 'opacity 0.4s ease', opacity: galleryNext ? 0 : 1 }}
            />
            {/* Overlay image layer (crossfade) */}
            {galleryNext && (
              <img
                src={galleryNext}
                alt={product.name}
                className="absolute inset-0 w-full h-full object-contain"
                style={{ transition: 'opacity 0.4s ease', opacity: fadeIn ? 1 : 0 }}
              />
            )}
            {/* Thumbnail strip — pinned to bottom */}
            {galleryImgs.length > 1 && (
              <div
                className="absolute bottom-0 left-0 right-0 flex gap-2 px-3 py-3 overflow-x-auto"
                style={{ background: 'rgba(15, 22, 41, 0.7)' }}
              >
                {galleryImgs.map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={(e) => handleGallerySelect(img, e)}
                    className="flex-shrink-0 w-16 h-16 rounded-md overflow-hidden transition-opacity"
                    style={{
                      outline: activeGalleryImg === img ? `2px solid ${GOLD}` : '2px solid transparent',
                      outlineOffset: 2,
                      opacity: activeGalleryImg === img ? 1 : 0.6,
                    }}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain bg-[#f7f6f3]" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right column — purchase panel */}
          <div className="flex flex-col justify-center px-6 md:px-12 py-12">

            {/* Product name */}
            <h2 className="font-playfair text-2xl md:text-3xl font-bold" style={{ color: NAVY }}>
              {product.name}
            </h2>

            {/* Star rating */}
            <p className="mt-2 text-sm" style={{ color: GOLD }}>
              {'★★★★★'}{' '}
              <span className="text-gray-500">4.8 (2,100+ reviews)</span>
            </p>

            {/* Divider */}
            <div className="h-px my-5" style={{ backgroundColor: `${GOLD}40` }} />

            {/* "BUNDLE & SAVE" header */}
            <div className="flex items-center gap-4 mb-5">
              <div className="flex-1 h-px" style={{ backgroundColor: `${GOLD}40` }} />
              <span
                className="text-xs font-bold uppercase tracking-widest whitespace-nowrap"
                style={{ color: NAVY }}
              >
                Bundle &amp; Save
              </span>
              <div className="flex-1 h-px" style={{ backgroundColor: `${GOLD}40` }} />
            </div>

            {/* Qty tier rows (clickable radio) */}
            <div className="space-y-2 mb-6">
              {tiers.map((tier) => {
                const isActive = selectedQty === tier.qty;
                return (
                  <button
                    key={tier.qty}
                    type="button"
                    onClick={() => selectTier(tier.qty)}
                    className={`w-full rounded-xl px-4 py-3.5 text-left transition-all border-2 ${
                      isActive ? 'shadow-md bg-white' : 'bg-white/60 border-gray-200 hover:border-gray-300'
                    }`}
                    style={isActive ? { borderColor: GOLD } : undefined}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                        style={{ borderColor: isActive ? GOLD : '#d1d5db' }}
                      >
                        {isActive && (
                          <span
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: GOLD }}
                          />
                        )}
                      </span>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-sm font-bold" style={{ color: NAVY }}>
                          {tier.label}
                        </span>
                        {tier.badge && (
                          <span
                            className="px-2 py-0.5 text-[10px] font-bold rounded-full whitespace-nowrap"
                            style={{ backgroundColor: GOLD, color: NAVY }}
                          >
                            {tier.badge}
                          </span>
                        )}
                      </div>
                      {tier.discount_pct > 0 && (
                        <span className="text-xs font-semibold text-green-600">
                          Save {tier.discount_pct}%
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Per-unit color selectors */}
            <div className="space-y-3">
              {unitColors.map((color, idx) => {
                const opt = colorOptions.find((o) => o.color === color);
                const base = opt?.basePrice || 0;
                const discounted = discountedPrice(base);
                return (
                  <div key={idx} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3 border border-gray-200">
                    <span className="text-xs font-semibold text-gray-400 w-12 flex-shrink-0">
                      Unit {idx + 1}
                    </span>
                    <select
                      value={color}
                      onChange={(e) => setUnitColor(idx, e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                      style={{ color: NAVY }}
                    >
                      {colorOptions.map((o) => (
                        <option key={o.color} value={o.color}>
                          {o.color}
                        </option>
                      ))}
                    </select>
                    <div className="flex items-center gap-1.5 flex-shrink-0 justify-end">
                      <span
                        className="text-sm font-bold"
                        style={{ color: discountPct > 0 ? GOLD : NAVY }}
                      >
                        ${discounted.toFixed(2)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Order summary */}
            <p className="text-sm font-semibold text-center mt-4" style={{ color: NAVY }}>
              {selectedQty} item{selectedQty !== 1 ? 's' : ''} &mdash; Total: ${orderTotal.toFixed(2)}
            </p>

            {/* Add to Cart button */}
            <button
              onClick={handleAddToCart}
              disabled={addedToCart}
              className="w-full mt-6 py-4 text-sm font-semibold rounded-lg transition-all disabled:opacity-80 flex items-center justify-center gap-2"
              style={{ backgroundColor: addedToCart ? '#16a34a' : GOLD, color: addedToCart ? '#fff' : NAVY }}
            >
              {addedToCart ? (
                <><Check className="w-5 h-5" /> Added to cart!</>
              ) : (
                <>Add {selectedQty} Item{selectedQty !== 1 ? 's' : ''} to Cart &mdash; ${orderTotal.toFixed(2)}</>
              )}
            </button>

            {addedToCart && (
              <div className="text-center mt-3">
                <Link
                  href={cartUrl}
                  className="text-sm font-semibold underline underline-offset-2 transition-colors"
                  style={{ color: GOLD }}
                >
                  View Cart &rarr;
                </Link>
              </div>
            )}

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-gray-500">
              <span>🔒 Secure Checkout</span>
              {product.warehouse_status === 'DIGITAL' ? (
                <span>⚡ Instant Download</span>
              ) : (
                <span>🚚 Free Shipping on $50+</span>
              )}
              <span>↩️ 30-Day Returns</span>
            </div>

            {/* Stock / delivery notice */}
            <p className={`text-center text-xs font-medium mt-4 ${product.warehouse_status === 'DIGITAL' ? 'text-violet-600' : product.warehouse_status === 'US' ? 'text-green-600' : 'text-amber-600'}`}>
              {product.warehouse_status === 'DIGITAL'
                ? '✓ Instant download — delivered to your email'
                : `✓ In stock — delivered in ${product.delivery_time || product.shipping_days || product.shipping_estimate || '7-15 business days'}`}
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3: BENEFITS STRIP ───────────────────────────── */}
      {sections.benefits && (
        <section style={{ backgroundColor: NAVY }} className="py-12">
          <div className="max-w-5xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {(sections.benefits || []).map((b: any, i: number) => (
                <div key={i} className="text-center">
                  <p className="text-3xl">{b.icon}</p>
                  <p className="font-semibold mt-2" style={{ color: GOLD }}>{b.title}</p>
                  <p className="text-sm mt-1" style={{ color: `${CREAM}cc` }}>{b.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── USE CASES ────────────────────────────────────────────── */}
      {sections.use_cases && Array.isArray(sections.use_cases) && sections.use_cases.some((uc: any) => uc.title) && (
        <section style={{ backgroundColor: CREAM }} className="py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2
              className="font-playfair text-3xl font-bold text-center mb-10"
              style={{ color: NAVY }}
            >
              {sections.use_cases_heading || 'One Blender. Endless Possibilities.'}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(sections.use_cases as Array<{ title: string; description: string; image_url: string }>).filter((uc) => uc.title).map((uc, i) => (
                <div key={i} className="text-center">
                  {uc.image_url ? (
                    <img
                      src={uc.image_url}
                      alt={uc.title}
                      className="aspect-square object-cover rounded-xl w-full"
                    />
                  ) : (
                    <div
                      className="aspect-square rounded-xl w-full flex items-center justify-center"
                      style={{ backgroundColor: NAVY }}
                    >
                      <span className="text-3xl font-bold" style={{ color: CREAM }}>
                        {uc.title.charAt(0)}
                      </span>
                    </div>
                  )}
                  <p className="font-semibold mt-3 text-center" style={{ color: NAVY }}>{uc.title}</p>
                  {uc.description && (
                    <p className="text-sm text-gray-600 text-center mt-1">{uc.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 4: FEATURE BLOCK 1 ──────────────────────────── */}
      {sections.feature_block_1 && (
        <FeatureBlock
          headline={sections.feature_block_1.headline}
          body={sections.feature_block_1.body}
          imagePosition={sections.feature_block_1.image_position || 'right'}
          image={featureImg1}
          bgClass="bg-white"
        />
      )}

      {/* ── SECTION 5: SOCIAL PROOF BAR ─────────────────────────── */}
      {sections.social_proof && (
        <section style={{ backgroundColor: CREAM, borderTop: `1px solid ${GOLD}33`, borderBottom: `1px solid ${GOLD}33` }} className="py-10">
          <div className="max-w-5xl mx-auto px-4">
            {sections.social_proof.headline && (
              <p
                className="text-center text-xs font-semibold uppercase tracking-widest mb-8"
                style={{ color: GOLD }}
              >
                {sections.social_proof.headline}
              </p>
            )}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 sm:gap-16">
              {['stat_1', 'stat_2', 'stat_3'].map((key, i) => {
                const val = sections.social_proof[key] || '';
                const parts = val.split(/\s*[-–—]\s*/);
                return (
                  <div key={key} className="text-center">
                    <p className="text-2xl font-bold" style={{ color: NAVY }}>
                      {parts[0]}
                    </p>
                    {parts[1] && <p className="text-sm text-gray-500 mt-1">{parts[1]}</p>}
                    {i < 2 && <div className="hidden sm:block" />}
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ── WHAT'S INCLUDED ─────────────────────────────────────── */}
      {sections.whats_included_enabled && sections.whats_included_text && (() => {
        const lines = (sections.whats_included_text as string)
          .split('\n')
          .map((l: string) => l.replace(/^[-–—]\s*/, '').trim())
          .filter(Boolean);
        if (lines.length === 0) return null;
        return (
          <section className="bg-white py-16">
            <div className="max-w-5xl mx-auto px-4">
              <h2
                className="font-playfair text-3xl font-bold text-center mb-10"
                style={{ color: NAVY }}
              >
                What&apos;s Included
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {lines.map((line: string, i: number) => {
                  const sep = line.match(/\s+[–—-]\s+/);
                  const title = sep ? line.slice(0, sep.index) : line;
                  const desc = sep ? line.slice(sep.index! + sep[0].length) : '';
                  return (
                    <div key={i} className="bg-[#f7f6f3] rounded-xl p-5 border border-gray-100">
                      <p className="font-semibold text-sm" style={{ color: NAVY }}>{title}</p>
                      {desc && <p className="text-sm text-gray-600 mt-1">{desc}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── SECTION 6: FEATURE BLOCK 2 ──────────────────────────── */}
      {sections.feature_block_2 && (
        <FeatureBlock
          headline={sections.feature_block_2.headline}
          body={sections.feature_block_2.body}
          imagePosition={sections.feature_block_2.image_position || 'left'}
          image={featureImg2}
          bgClass="bg-gray-50"
        />
      )}

      {/* ── SECTION 7: TESTIMONIALS ─────────────────────────────── */}
      {sections.testimonials && (
        <section className="bg-white py-16">
          <div className="max-w-5xl mx-auto px-4">
            <h2
              className="font-playfair text-3xl font-bold text-center mb-10"
              style={{ color: NAVY }}
            >
              What Our Customers Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {(sections.testimonials || []).map((t: any, i: number) => (
                <div key={i} className="bg-gray-50 rounded-2xl p-6">
                  <p style={{ color: GOLD }} className="text-lg">{'★'.repeat(t.stars || 5)}</p>
                  <p className="text-gray-700 italic mt-3 leading-relaxed">
                    &ldquo;{t.review}&rdquo;
                  </p>
                  <p className="font-semibold mt-4" style={{ color: NAVY }}>{t.name}</p>
                  {t.verified && (
                    <p className="text-xs text-green-600 font-medium mt-1">
                      &#10003; Verified Purchase
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── SECTION 8: FAQ ACCORDION ────────────────────────────── */}
      {sections.faq && sections.faq.length > 0 && (
        <FaqSection items={sections.faq} />
      )}

      {/* ── SECTION 9: CLOSING CTA ──────────────────────────────── */}
      {sections.closing_cta && (
        <section style={{ backgroundColor: NAVY }} className="py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2
              className="font-playfair text-4xl font-bold"
              style={{ color: CREAM }}
            >
              {sections.closing_cta.headline}
            </h2>
            <p className="text-lg mt-4" style={{ color: GOLD }}>
              {sections.closing_cta.urgency_line}
            </p>
            <button
              onClick={scrollToSelector}
              className="mt-8 px-10 py-4 text-sm font-semibold rounded-lg transition-opacity hover:opacity-90"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              {sections.closing_cta.cta_text || 'Order Now'}
            </button>
            <p className="mt-4 text-sm" style={{ color: `${CREAM}b3` }}>
              &#10003; Free Shipping on $50+ &nbsp; &#10003; 30-Day Returns &nbsp; &#10003; Secure Checkout
            </p>
          </div>
        </section>
      )}

      {/* ── MINIMAL FOOTER ──────────────────────────────────────── */}
      <footer style={{ backgroundColor: NAVY }} className="py-8">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm" style={{ color: `${CREAM}99` }}>
          <p>
            &copy; {new Date().getFullYear()} MooreItems
            {' · '}
            <Link href="/privacy-policy" className="underline underline-offset-2 hover:opacity-80">Privacy Policy</Link>
            {' · '}
            <Link href="/returns" className="underline underline-offset-2 hover:opacity-80">Returns</Link>
            {' · '}
            <Link href="/contact" className="underline underline-offset-2 hover:opacity-80">Contact</Link>
          </p>
        </div>
      </footer>
    </>
  );
}

/* ─── Feature Block sub-component ────────────────────────────── */

function FeatureBlock({
  headline,
  body,
  imagePosition,
  image,
  bgClass,
}: {
  headline: string;
  body: string;
  imagePosition: string;
  image: string;
  bgClass: string;
}) {
  const imgRight = imagePosition === 'right';
  return (
    <section className={`${bgClass} py-16`}>
      <div className="max-w-5xl mx-auto px-4">
        <div className={`grid md:grid-cols-2 gap-10 items-center ${!imgRight ? 'md:[direction:rtl]' : ''}`}>
          <div className={!imgRight ? 'md:[direction:ltr]' : ''}>
            <h2
              className="font-playfair text-3xl font-bold"
              style={{ color: NAVY }}
            >
              {headline}
            </h2>
            <p className="text-gray-600 leading-relaxed mt-4 whitespace-pre-line">{body}</p>
          </div>
          <div className={!imgRight ? 'md:[direction:ltr]' : ''}>
            {image && (
              <img src={image} alt="" className="rounded-2xl shadow-lg w-full object-cover" />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ Accordion sub-component ────────────────────────────── */

function FaqSection({ items }: { items: Array<{ q: string; a: string }> }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <section style={{ backgroundColor: CREAM }} className="py-16">
      <div className="max-w-3xl mx-auto px-4">
        <h2
          className="font-playfair text-3xl font-bold text-center mb-10"
          style={{ color: NAVY }}
        >
          Frequently Asked Questions
        </h2>
        <div className="space-y-0">
          {items.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="border-b border-gray-300">
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                  className="w-full flex items-center justify-between py-5 text-left"
                >
                  <span className="text-sm font-semibold pr-4" style={{ color: NAVY }}>
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-200 ${isOpen ? 'max-h-96 pb-5' : 'max-h-0'}`}
                >
                  <p className="text-sm text-gray-600 leading-relaxed">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
