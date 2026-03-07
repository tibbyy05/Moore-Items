'use client';

import React, { useEffect, useState } from 'react';
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
    mi_categories: { name: string; slug: string } | null;
    mi_product_variants: Array<{
      id: string;
      name: string;
      color: string | null;
      size: string | null;
      retail_price: number;
      stock_count: number;
      image_url: string | null;
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
  const tiers: DiscountTier[] = page.quantity_discounts || [];
  const variants = product.mi_product_variants || [];

  // State
  const [selectedTierIdx, setSelectedTierIdx] = useState(() => {
    const popIdx = tiers.findIndex((t) => t.badge);
    return popIdx >= 0 ? popIdx : 0;
  });
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    variants.length > 0 ? variants[0].id : null
  );
  const [addedToCart, setAddedToCart] = useState(false);

  // Track view on mount (fire-and-forget)
  useEffect(() => {
    fetch('/api/lp/track-view', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: page.slug }),
    }).catch(() => {});
  }, [page.slug]);

  const selectedTier = tiers[selectedTierIdx] || { qty: 1, label: '1 Item', discount_pct: 0, badge: '' };
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) || null;
  const unitPrice = Math.round(product.retail_price * (1 - selectedTier.discount_pct / 100) * 100) / 100;
  const totalPrice = Math.round(unitPrice * selectedTier.qty * 100) / 100;
  const savings = Math.round((product.retail_price * selectedTier.qty - totalPrice) * 100) / 100;

  // Unique variant values
  const colors = Array.from(new Set(variants.filter((v) => v.color).map((v) => v.color!)));
  const sizes = Array.from(new Set(variants.filter((v) => v.size).map((v) => v.size!)));

  const promoCodeKey = `qty_${selectedTier.qty}`;
  const promoCode = page.promo_codes?.[promoCodeKey] || null;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      variantId: selectedVariantId,
      name: product.name,
      variantName: selectedVariant?.name || undefined,
      price: unitPrice,
      quantity: selectedTier.qty,
      image: product.images?.[0] || '',
      warehouse: (product.warehouse || 'US') as 'US' | 'CN' | 'CA',
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 3000);
  };

  const cartUrl = promoCode && selectedTier.discount_pct > 0
    ? `/cart?promo=${encodeURIComponent(promoCode)}`
    : '/cart';

  const heroImg = product.images?.[0] || '';
  const featureImg1 = product.images?.[1] || product.images?.[0] || '';
  const featureImg2 = product.images?.[2] || product.images?.[1] || product.images?.[0] || '';

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
                &#10003; Free US Shipping &nbsp; &#10003; 30-Day Returns &nbsp; &#10003; Secure Checkout
              </p>
            </div>
            {heroImg && (
              <div className="flex justify-center">
                <img
                  src={heroImg}
                  alt={product.name}
                  className="rounded-xl max-h-96 object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── SECTION 2: QUANTITY SELECTOR ────────────────────────── */}
      <section id="quantity-selector" className="bg-white py-16">
        <div className="max-w-3xl mx-auto px-4">
          <p
            className="text-center text-xs font-semibold uppercase tracking-widest mb-8"
            style={{ color: GOLD }}
          >
            Choose Your Package
          </p>

          {/* Tier cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {tiers.map((tier, i) => {
              const tierUnit = Math.round(product.retail_price * (1 - tier.discount_pct / 100) * 100) / 100;
              const tierTotal = Math.round(tierUnit * tier.qty * 100) / 100;
              const tierSaved = Math.round((product.retail_price * tier.qty - tierTotal) * 100) / 100;
              const isSelected = selectedTierIdx === i;

              return (
                <button
                  key={tier.qty}
                  type="button"
                  onClick={() => setSelectedTierIdx(i)}
                  className={`relative rounded-xl p-5 text-center transition-all border-2 ${
                    isSelected ? 'shadow-lg' : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={isSelected ? { borderColor: GOLD } : undefined}
                >
                  {tier.badge && (
                    <span
                      className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-[11px] font-bold rounded-full whitespace-nowrap"
                      style={{ backgroundColor: GOLD, color: NAVY }}
                    >
                      {tier.badge}
                    </span>
                  )}
                  <p className="text-lg font-bold mt-1" style={{ color: NAVY }}>{tier.label}</p>
                  <p className="text-2xl font-bold mt-2" style={{ color: NAVY }}>
                    ${tierUnit.toFixed(2)}
                    <span className="text-sm font-normal text-gray-500"> each</span>
                  </p>
                  {tier.qty > 1 && (
                    <p className="text-sm text-gray-500 mt-1">${tierTotal.toFixed(2)} total</p>
                  )}
                  {tier.discount_pct > 0 && (
                    <p className="text-sm font-semibold text-green-600 mt-1">
                      You save ${tierSaved.toFixed(2)}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          {/* Variant selector */}
          {variants.length > 0 && (colors.length > 0 || sizes.length > 0) && (
            <div className="mt-6 flex flex-wrap gap-4">
              {colors.length > 0 && (
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                  <select
                    value={selectedVariant?.color || ''}
                    onChange={(e) => {
                      const match = variants.find(
                        (v) => v.color === e.target.value && (selectedVariant?.size ? v.size === selectedVariant.size : true)
                      );
                      if (match) setSelectedVariantId(match.id);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                  >
                    {colors.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              )}
              {sizes.length > 0 && (
                <div className="flex-1 min-w-[140px]">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                  <select
                    value={selectedVariant?.size || ''}
                    onChange={(e) => {
                      const match = variants.find(
                        (v) => v.size === e.target.value && (selectedVariant?.color ? v.color === selectedVariant.color : true)
                      );
                      if (match) setSelectedVariantId(match.id);
                    }}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/40"
                  >
                    {sizes.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

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
              <>Add {selectedTier.qty > 1 ? `${selectedTier.qty}` : ''} to Cart &mdash; ${totalPrice.toFixed(2)}</>
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
              {sections.closing_cta.cta_text || 'Shop Now'}
            </button>
            <p className="mt-4 text-sm" style={{ color: `${CREAM}b3` }}>
              &#10003; Free US Shipping &nbsp; &#10003; 30-Day Returns &nbsp; &#10003; Secure Checkout
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
