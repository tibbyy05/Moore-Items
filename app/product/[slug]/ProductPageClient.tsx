'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Truck, Heart, ShoppingCart, Check, Download, Eye, AlertTriangle, Flame } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { PriceDisplay } from '@/components/product/PriceDisplay';
import { StarRating } from '@/components/ui/star-rating';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import { VariantSelector } from '@/components/product/VariantSelector';
import { CustomButton } from '@/components/ui/custom-button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { ImageGallery } from '@/components/storefront/ImageGallery';
import { TrustBadges } from '@/components/storefront/TrustBadges';
import { RecentlyViewed, addRecentlyViewed } from '@/components/storefront/RecentlyViewed';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Product, ProductVariant } from '@/lib/types';
import { cn } from '@/lib/utils';

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const days = Math.floor(seconds / 86400);
  if (days < 1) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 14) return '1 week ago';
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 60) return '1 month ago';
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years > 1 ? 's' : ''} ago`;
}

const MARKETING_PHRASES = [
  'NO NEED plumber',
  'SPECIFICATIONS',
  'DUAL MODE SETTING',
  'HEALTHY QUALITY',
  'EASY INSTALLATION',
  'dropshipping',
  'banned from',
  'prohibited',
  'not for sale on',
  'may be shipped via',
  'amazon',
  'temu',
  'wayfair',
  'aliexpress',
];

const SECTION_KEYS = [
  { label: 'Specifications', variants: ['specifications', 'specification'] },
  { label: 'Features', variants: ['features', 'feature'] },
  { label: 'Installation', variants: ['installation', 'install'] },
  { label: 'Package Includes', variants: ['package includes', 'package contents', 'package content'] },
  { label: 'How To Use', variants: ['how to use', 'usage'] },
];

const SPEC_PATTERNS = [
  /\b\d+(\.\d+)?\s?(cm|mm|inches|inch|in|ft|lbs?|kg|g)\b/i,
  /\bmaterial\s*:/i,
  /\bdimensions?\b/i,
  /\bweight\b/i,
];

function titleCase(value: string) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function cleanDescriptionHtml(html: string) {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<video[\s\S]*?<\/video>/gi, '');

  MARKETING_PHRASES.forEach((phrase) => {
    cleaned = cleaned.replace(new RegExp(phrase, 'gi'), '');
  });

  cleaned = cleaned.replace(/(&nbsp;)+/gi, ' ');

  cleaned = cleaned.replace(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi, (_match, text) => {
    const next = titleCase(String(text).replace(/<[^>]*>/g, ''));
    return `<h3>${next}</h3>`;
  });

  const parts = cleaned.split(/(<[^>]+>)/g);
  cleaned = parts
    .map((part) => {
      if (part.startsWith('<')) return part;
      return part.replace(
        /\b([A-Z]{3,}(?:\s+[A-Z]{3,}){2,})\b/g,
        (match) => titleCase(match)
      );
    })
    .join('');

  return cleaned.trim();
}

function extractSpecs(text: string) {
  const lines = text
    .split(/[\n•\-]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const matches = lines.filter((line) => SPEC_PATTERNS.some((pattern) => pattern.test(line)));
  return Array.from(new Set(matches)).slice(0, 6);
}

function extractDescriptionSections(html: string) {
  if (!html) return [];
  let working = html;

  SECTION_KEYS.forEach((section) => {
    section.variants.forEach((variant) => {
      const pattern = new RegExp(
        `<(h[1-6]|strong)[^>]*>\\s*${variant}\\s*<\\/\\1>`,
        'gi'
      );
      working = working.replace(pattern, `[[SECTION:${section.label}]]`);
    });
  });

  const parts = working.split(/\[\[SECTION:([^\]]+)\]\]/g);
  if (parts.length <= 1) {
    return [{ title: 'Details', html }];
  }

  const sections: Array<{ title: string; html: string }> = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i];
    const content = parts[i + 1] || '';
    if (content.trim().length > 0) {
      sections.push({ title, html: content.trim() });
    }
  }

  return sections.length > 0 ? sections : [{ title: 'Details', html }];
}

function DescriptionFormatter({
  html,
  productName,
  categoryName,
}: {
  html: string;
  productName: string;
  categoryName: string;
}) {
  const cleanedHtml = cleanDescriptionHtml(html || '');
  const plainText = cleanedHtml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  if (!plainText) {
    return (
      <p className="text-warm-700 leading-relaxed">
        {productName} in {categoryName || 'our collection'}.
      </p>
    );
  }

  const specs = extractSpecs(plainText);
  const sections = extractDescriptionSections(cleanedHtml);

  return (
    <div>
      {sections.length > 1 ? (
        <Accordion type="multiple" className="bg-warm-50/40 rounded-2xl border border-warm-200">
          {sections.map((section, index) => (
            <AccordionItem key={section.title} value={`section-${index}`}>
              <AccordionTrigger className="text-warm-900">
                {section.title}
              </AccordionTrigger>
              <AccordionContent>
                <div
                  className="prose max-w-none text-warm-700 prose-headings:text-warm-900 prose-p:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: section.html }}
                />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div
          className="prose max-w-none text-warm-700 prose-headings:text-warm-900 prose-p:leading-relaxed"
          dangerouslySetInnerHTML={{ __html: sections[0]?.html || cleanedHtml }}
        />
      )}
      {specs.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-playfair font-semibold text-warm-900 mb-2">
            Specifications
          </h3>
          <ul className="list-disc list-inside text-warm-700 space-y-1">
            {specs.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

interface ProductPageClientProps {
  params: { slug: string };
  initialData?: any;
}

export function ProductPageClient({ params, initialData }: ProductPageClientProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [productReviews, setProductReviews] = useState<Array<any>>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewAverage, setReviewAverage] = useState(0);
  const [reviewDistribution, setReviewDistribution] = useState<
    Array<{ star: number; count: number }>
  >([]);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [galleryIndex, setGalleryIndex] = useState<number>(0);
  const [hasUserSelectedVariant, setHasUserSelectedVariant] = useState(false);
  const hasInitialized = useRef(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [addedState, setAddedState] = useState(false);
  const [viewingCount, setViewingCount] = useState<number | null>(null);

  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const addToCartRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hasInitialized.current) return;
    if (!hasUserSelectedVariant) return;
    if (selectedVariant?.imageUrl && product?.images) {
      const idx = product.images.indexOf(selectedVariant.imageUrl);
      if (idx !== -1) {
        setGalleryIndex(idx);
      }
    }
  }, [selectedVariant, product?.images, hasUserSelectedVariant]);

  const loadReviews = async (productId: string, page: number) => {
    setReviewLoading(true);
    try {
      const response = await fetch(`/api/reviews/${productId}?page=${page}&limit=5&sort=newest`);
      const data = await response.json();
      if (response.ok) {
        setProductReviews((prev) =>
          page === 1 ? data.reviews || [] : [...prev, ...(data.reviews || [])]
        );
        setReviewTotal(data.total || 0);
        setReviewAverage(data.averageRating || 0);
        setReviewDistribution(data.distribution || []);
      }
    } catch (error) {
      console.error('Failed to load reviews', error);
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);

      let rawProduct: any;
      if (initialData) {
        rawProduct = initialData;
      } else {
        const response = await fetch(`/api/products/${params.slug}`);
        const data = await response.json();
        if (!response.ok) {
          setLoading(false);
          return;
        }
        rawProduct = data.product;
      }

      const rawImages = rawProduct.images || [];
      const seenImages = new Set<string>();
      const productImages: string[] = rawImages.filter(
        (image: any): image is string => {
          if (typeof image !== 'string' || image.trim().length === 0) return false;
          if (seenImages.has(image)) return false;
          seenImages.add(image);
          return true;
        }
      );

      const variantImages = (rawProduct.mi_product_variants || [])
        .map((variant: any) => variant?.image_url)
        .filter(
          (image: any): image is string => typeof image === 'string' && image.trim() !== ''
        );
      const variantOnlyImages = variantImages.filter((image: string) => !productImages.includes(image));
      const allImages = [...productImages, ...variantOnlyImages];

      const mappedProduct: Product = {
        id: rawProduct.id,
        name: rawProduct.name,
        slug: rawProduct.slug,
        price: rawProduct.retail_price,
        compareAtPrice: rawProduct.compare_at_price || null,
        createdAt: rawProduct.created_at || undefined,
        images: allImages,
        rating: rawProduct.average_rating || rawProduct.rating || 0,
        reviewCount: rawProduct.review_count || 0,
        category: rawProduct.mi_categories?.slug || '',
        categoryLabel: rawProduct.mi_categories?.name || 'Uncategorized',
        badge: rawProduct.badge || null,
        variants:
          rawProduct.mi_product_variants?.map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            color: variant.color || undefined,
            size: variant.size || undefined,
            price: variant.retail_price || rawProduct.retail_price,
            inStock:
              rawProduct.cj_pid
                ? variant.is_active !== false
                : variant.stock_count === null || variant.stock_count === undefined
                  ? true
                  : variant.stock_count > 0,
            imageUrl: variant.image_url || undefined,
          })) || [],
        description: rawProduct.description || '',
        shippingDays: rawProduct.shipping_estimate || rawProduct.shipping_days || '7-12 days',
        warehouse: rawProduct.warehouse || 'CN',
        isDigital: !!(rawProduct.digital_file_path || rawProduct.mi_categories?.slug === 'digital-downloads'),
        inStock: rawProduct.cj_pid
          ? rawProduct.status === 'active'
          : rawProduct.stock_count > 0,
        stockCount: rawProduct.stock_count || 0,
      };

      setProduct(mappedProduct);
      setSelectedVariant(mappedProduct.variants[0]);
      setHasUserSelectedVariant(false);
      setGalleryIndex(0);
      hasInitialized.current = false;
      window.setTimeout(() => {
        hasInitialized.current = true;
      }, 500);

      setReviewPage(1);
      await loadReviews(mappedProduct.id, 1);

      const relatedResponse = await fetch(
        `/api/products?category=${mappedProduct.category}&limit=8`
      );
      const relatedData = await relatedResponse.json();

      const mapRelated = (item: any): Product => ({
        id: item.id,
        name: item.name,
        slug: item.slug,
        price: item.retail_price,
        compareAtPrice: item.compare_at_price || null,
        createdAt: item.created_at || undefined,
        images: Array.from(
          new Set(
            (item.images || []).filter(
              (image: any): image is string => typeof image === 'string' && image.trim().length > 0
            )
          )
        ),
        rating: item.average_rating || item.rating || 0,
        reviewCount: item.review_count || 0,
        category: item.mi_categories?.slug || '',
        categoryLabel: item.mi_categories?.name || 'Uncategorized',
        badge: item.badge || null,
        variants:
          item.mi_product_variants?.map((variant: any) => ({
            id: variant.id,
            name: variant.name,
            color: variant.color || undefined,
            size: variant.size || undefined,
            price: variant.retail_price || item.retail_price,
            inStock: variant.stock_count > 0,
            imageUrl: variant.image_url || undefined,
          })) || [],
        description: item.description || '',
        shippingDays: item.shipping_estimate || item.shipping_days || '7-12 days',
        warehouse: item.warehouse || 'CN',
        inStock: item.stock_count > 0,
        stockCount: item.stock_count || 0,
      });

      if (relatedResponse.ok) {
        const mappedRelated = (relatedData.products || [])
          .filter((item: any) => item.slug !== mappedProduct.slug)
          .map(mapRelated);

        let related = mappedRelated;
        if (related.length < 4) {
          const fallbackResponse = await fetch(`/api/products?limit=12`);
          const fallbackData = await fallbackResponse.json();
          if (fallbackResponse.ok) {
            const fallback = (fallbackData.products || [])
              .filter((item: any) => item.slug !== mappedProduct.slug)
              .map(mapRelated)
              .filter((item: Product) => !related.find((p: Product) => p.id === item.id));
            related = [
              ...related,
              ...fallback.sort(() => 0.5 - Math.random()),
            ].slice(0, 4);
          }
        } else {
          related = related.slice(0, 4);
        }

        setRelatedProducts(related);
      }
      setLoading(false);
    };

    fetchProduct();
  }, [params.slug]);


  useEffect(() => {
    if (!product) return;
    addRecentlyViewed(product.id);
  }, [product]);

  useEffect(() => {
    if (!product || product.isDigital) {
      setViewingCount(null);
      return;
    }
    const initial = Math.floor(Math.random() * 23) + 3;
    setViewingCount(initial);
    const interval = window.setInterval(() => {
      setViewingCount((current) => {
        if (current === null) return current;
        const delta = Math.floor(Math.random() * 3) + 1;
        const next = Math.random() < 0.5 ? current - delta : current + delta;
        return Math.min(25, Math.max(3, next));
      });
    }, 30000);

    return () => window.clearInterval(interval);
  }, [product?.id, product?.isDigital]);

  useEffect(() => {
    if (product && typeof window !== 'undefined' && window.fbq) {
      window.fbq('track', 'ViewContent', {
        content_ids: [product.id],
        content_type: 'product',
        content_name: product.name,
        value: product.price,
        currency: 'USD',
      });
    }
  }, [product?.id]);

  useEffect(() => {
    if (!addToCartRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(!entry.isIntersecting),
      { rootMargin: '0px 0px -120px 0px' }
    );
    observer.observe(addToCartRef.current);
    return () => observer.disconnect();
  }, [product]);

  if (!product && !loading) {
    return (
      <>
        <Header />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-warm-900 mb-2">Product not found</h1>
            <Link href="/" className="text-gold-600 hover:underline">
              Return to home
            </Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <CartDrawer />
        <main className="bg-white min-h-[60vh] flex items-center justify-center">
          <p className="text-warm-600">Loading product...</p>
        </main>
        <Footer />
      </>
    );
  }

  const effectivePrice = selectedVariant?.price || product.price;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      slug: product.slug,
      variantId: selectedVariant?.id ?? null,
      name: product.name,
      variantName: selectedVariant?.name,
      price: effectivePrice,
      quantity,
      image: product.images[0],
      warehouse: product.warehouse,
      isDigital: product.isDigital,
    });
    setAddedState(true);
    window.setTimeout(() => setAddedState(false), 1500);
  };

  const averageRating = reviewAverage || product.rating;
  const ratingDistribution = reviewDistribution.map((entry) => ({
    star: entry.star,
    count: entry.count,
    percentage: reviewTotal > 0 ? (entry.count / reviewTotal) * 100 : 0,
  }));
  const cleanDescription = product.description || '';
  const hashString = (value: string) => {
    let hash = 0;
    for (let i = 0; i < value.length; i += 1) {
      hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
    }
    return hash;
  };
  const displayStock = (() => {
    if (product.isDigital) return null;
    if (product.stockCount <= 20) return product.stockCount;
    const roll = hashString(`${product.id}:stock`) % 100;
    if (roll < 15) {
      return 3 + (hashString(`${product.id}:stockcount`) % 13);
    }
    return null;
  })();
  const soldCount = (() => {
    if (product.isDigital) return null;
    const seed = (hashString(`${product.id}:sold`) % 3) + 1;
    return Math.min(Math.floor(product.reviewCount * 0.3) + seed, 15);
  })();

  return (
    <>
      <Header />
      <CartDrawer />

      <main className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <nav className="flex items-center gap-1.5 text-sm mb-8">
            <Link href="/" className="text-warm-500 hover:text-gold-600 transition-colors">
              Home
            </Link>
            <span className="text-warm-400">&gt;</span>
            <Link
              href={`/category/${product.category}`}
              className="text-warm-500 hover:text-gold-600 transition-colors"
            >
              {product.categoryLabel}
            </Link>
            <span className="text-warm-400">&gt;</span>
            <span className="text-warm-700 break-words">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 mb-16">
            <ImageGallery
              images={product.images}
              productName={product.name}
              activeImageIndex={galleryIndex}
            />

            <div>
              <p className="text-xs font-bold text-gold-600 uppercase tracking-wider mb-2">
                {product.categoryLabel}
              </p>
              <h1 className="text-3xl sm:text-4xl font-playfair font-semibold text-warm-900 mb-4">
                {product.name}
              </h1>

              <button className="flex items-center gap-2 mb-6">
                <StarRating rating={averageRating} reviewCount={reviewTotal} />
              </button>
              {soldCount ? (
                <div className="flex items-center gap-2 text-xs text-warm-600 mb-5">
                  <Flame className="w-4 h-4 text-amber-500" />
                  <span>{soldCount} sold in the last 24 hours</span>
                </div>
              ) : null}

              <PriceDisplay
                price={effectivePrice}
                compareAtPrice={product.compareAtPrice}
                size="lg"
                className="mb-6"
              />
              {!product.isDigital && viewingCount ? (
                <div className="flex items-center gap-2 text-xs text-warm-500 mb-6">
                  <Eye className="w-4 h-4" />
                  <span>{viewingCount} people are viewing this right now</span>
                </div>
              ) : null}

              {product.isDigital ? (
                <div className="mb-6 bg-violet-50 border border-violet-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center">
                      <Download className="w-5 h-5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-violet-800">
                        Instant Digital Download
                      </p>
                      <p className="text-xs text-violet-600">
                        Available immediately after purchase · No shipping required
                      </p>
                    </div>
                  </div>
                </div>
              ) : product.warehouse === 'US' ? (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Fast US Shipping — 2-5 Business Days
                      </p>
                      <p className="text-xs text-green-600">
                        Ships from United States · Free shipping on orders $50+
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 text-sm text-warm-700 flex flex-wrap items-center gap-2">
                  <Truck className="w-4 h-4 text-gold-500" />
                  <span>
                    Standard Shipping — Estimated {product.shippingDays}
                  </span>
                  <span className="text-warm-500">· Ships from</span>
                  <span className="font-semibold text-warm-900">
                    {product.warehouse === 'CA' ? 'Canada' : 'China'}
                  </span>
                </div>
              )}

              {product.variants.length > 0 && (
                <div className="mb-6">
                  <VariantSelector
                    variants={product.variants}
                    selectedVariantId={selectedVariant?.id}
                    onSelect={(variant) => {
                      setSelectedVariant(variant);
                      setHasUserSelectedVariant(true);
                    }}
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-semibold text-warm-900 mb-3">
                  Quantity
                </label>
                <QuantityStepper value={quantity} onChange={setQuantity} max={product.stockCount} />
              </div>

              <div className="space-y-3 mb-6">
                {displayStock ? (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Only {displayStock} left in stock</span>
                  </div>
                ) : null}
                <CustomButton
                  variant="primary"
                  size="lg"
                  className={cn('w-full', addedState && 'bg-success text-white hover:bg-success')}
                  onClick={handleAddToCart}
                  disabled={!product.inStock}
                  ref={addToCartRef}
                >
                  {addedState ? (
                    <>
                      <Check className="w-5 h-5" />
                      Added!
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                    </>
                  )}
                </CustomButton>

                <CustomButton
                  variant="secondary"
                  size="lg"
                  className="w-full"
                  onClick={() => toggleWishlist(product.id, product.name)}
                >
                  <Heart className={isWishlisted(product.id) ? 'fill-current text-gold-500' : ''} />
                  {isWishlisted(product.id) ? 'Remove from Wishlist' : 'Add to Wishlist'}
                </CustomButton>
              </div>

              <div className="pb-6 border-b border-warm-200">
                <TrustBadges variant="compact" />
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-4">
                  Product Details
                </h2>
                <DescriptionFormatter
                  html={cleanDescription}
                  productName={product.name}
                  categoryName={product.categoryLabel}
                />
              </div>

              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="shipping">
                  <AccordionTrigger>
                    {product.isDigital ? 'Delivery Information' : 'Shipping Information'}
                  </AccordionTrigger>
                  <AccordionContent>
                    {product.isDigital ? (
                      <div className="space-y-2 text-warm-700">
                        <p>
                          <strong>Delivery:</strong> Instant download after purchase
                        </p>
                        <p>
                          Download links are available on the order confirmation page and in your order history.
                          A link is also included in your confirmation email.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-warm-700">
                        <p>
                          <strong>US Warehouse:</strong> 2-5 business days
                        </p>
                        <p>
                          <strong>International:</strong> {product.shippingDays}
                        </p>
                        <p>Free shipping on orders over $50.</p>
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="returns">
                  <AccordionTrigger>
                    {product.isDigital ? 'Refund Policy' : 'Returns Policy'}
                  </AccordionTrigger>
                  <AccordionContent>
                    {product.isDigital ? (
                      <p className="text-warm-700 leading-relaxed">
                        Due to the nature of digital products, all sales are final.
                        If you experience issues with your download, please contact our support team.
                      </p>
                    ) : (
                      <p className="text-warm-700 leading-relaxed">
                        We offer a 30-day return policy for all items. Products must be unused and in
                        original packaging. Return shipping is free for defective items.
                      </p>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>

          <section className="border-t border-warm-200 pt-16 mb-16">
            <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-8">
              Customer Reviews
            </h2>

            <div className="grid lg:grid-cols-[300px_1fr] gap-8 mb-12">
              <div className="text-center">
                <div className="text-5xl font-bold text-warm-900 mb-2">
                  {averageRating.toFixed(1)}
                </div>
                <StarRating rating={averageRating} size="lg" className="justify-center mb-2" />
                <p className="text-sm text-warm-600">Based on {reviewTotal} reviews</p>
              </div>

              <div className="space-y-2">
                {ratingDistribution.map((dist) => (
                  <div key={dist.star} className="flex items-center gap-3">
                    <span className="text-sm text-warm-700 w-12">{dist.star} star</span>
                    <div className="flex-1 h-2 bg-warm-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gold-500"
                        style={{ width: `${dist.percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-warm-600 w-12 text-right">{dist.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {productReviews.length === 0 ? (
              <div className="bg-warm-50 border border-warm-200 rounded-2xl p-8 text-center">
                <p className="text-warm-600">No reviews yet.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {productReviews.map((review: any) => (
                  <div key={review.id} className="border-b border-warm-200 pb-6 last:border-0">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-warm-900">
                            {review.customer_name || 'Customer'}
                          </span>
                          {review.reviewer_country && (
                            <span className="text-xs text-warm-500">
                              {review.reviewer_country}
                            </span>
                          )}
                        </div>
                        <StarRating rating={Number(review.rating || 0)} size="sm" />
                      </div>
                      <span className="text-sm text-warm-500">
                        {timeAgo(review.created_at)}
                      </span>
                    </div>
                    <p className="text-warm-700 leading-relaxed">{review.body}</p>
                    {Array.isArray(review.images) && review.images.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-3">
                        {review.images.map((url: string, index: number) => (
                          <a
                            key={`${review.id}-${index}`}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="block w-16 h-16 rounded-lg overflow-hidden border border-warm-200"
                          >
                            <img src={url} alt="Review" className="w-full h-full object-cover" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {reviewTotal > productReviews.length && (
              <div className="mt-8 text-center">
                <CustomButton
                  variant="secondary"
                  onClick={() => {
                    const nextPage = reviewPage + 1;
                    setReviewPage(nextPage);
                    loadReviews(product.id, nextPage);
                  }}
                  disabled={reviewLoading}
                >
                  {reviewLoading ? 'Loading...' : 'Show more reviews'}
                </CustomButton>
              </div>
            )}
          </section>

          {relatedProducts.length > 0 && (
            <section>
              <h2 className="text-2xl font-playfair font-semibold text-warm-900 mb-8">
                You May Also Like
              </h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4">
                {relatedProducts.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            </section>
          )}

          <RecentlyViewed excludeId={product.id} />
        </div>
      </main>

      {product && (
        <div
          className={cn(
            'fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-warm-200 px-4 py-3 md:hidden transition-transform shadow-[0_-6px_20px_rgba(0,0,0,0.08)]',
            showStickyBar ? 'translate-y-0' : 'translate-y-full'
          )}
        >
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-warm-900 break-words">{product.name}</p>
              <p className="text-sm text-warm-600">${effectivePrice.toFixed(2)}</p>
            </div>
            <CustomButton
              variant="primary"
              size="sm"
              className={cn(addedState && 'bg-success text-white hover:bg-success')}
              onClick={handleAddToCart}
              disabled={!product.inStock}
            >
              {addedState ? (
                <>
                  <Check className="w-4 h-4" />
                  Added
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </>
              )}
            </CustomButton>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
