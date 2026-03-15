'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Truck, Heart, ShoppingCart, Check, Download, Eye, AlertTriangle, Flame, Star, ShieldCheck, Globe } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { PriceDisplay } from '@/components/product/PriceDisplay';
import { StarRating } from '@/components/ui/star-rating';
import { QuantityStepper } from '@/components/product/QuantityStepper';
import VariantSelector from '@/components/product/VariantSelector';
import { CustomButton } from '@/components/ui/custom-button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCart } from '@/components/providers/CartProvider';
import { useWishlist } from '@/components/providers/WishlistProvider';
import { ImageGallery } from '@/components/storefront/ImageGallery';
import { TrustBadges } from '@/components/storefront/TrustBadges';
import { RecentlyViewed, addRecentlyViewed } from '@/components/storefront/RecentlyViewed';
import { ProductCard } from '@/components/storefront/ProductCard';
import { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useVariantSelection } from '@/hooks/useVariantSelection';

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

// Only match dedicated spec lines formatted as "Label: Value" or "Label — Value"
const SPEC_LINE_PATTERN = /^[\w\s]{1,30}\s*[:\u2013\u2014\-]\s*.+/;

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
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<video[\s\S]*?<\/video>/gi, '')
    .replace(/<img[^>]*>/gi, '');

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
    .split(/[\n•]+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const matches = lines.filter((line) => SPEC_LINE_PATTERN.test(line) && line.length < 80);
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
  const [reviewFormOpen, setReviewFormOpen] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewEmail, setReviewEmail] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewResult, setReviewResult] = useState<{success: boolean; message: string} | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [galleryIndex, setGalleryIndex] = useState<number>(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [addedState, setAddedState] = useState(false);
  const [viewingCount, setViewingCount] = useState<number | null>(null);

  const {
    matrix,
    selectedColor,
    selectedSize,
    selectedVariant,
    isValidCombo,
    canAddToCart,
    variantImageUrl,
    handleColorChange,
    handleSizeChange,
    hasInitialized,
  } = useVariantSelection(product?.variants || []);

  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const addToCartRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!hasInitialized) return;
    if (variantImageUrl && product?.images) {
      const idx = product.images.indexOf(variantImageUrl);
      if (idx !== -1) {
        setGalleryIndex(idx);
      }
    }
  }, [hasInitialized, variantImageUrl, product?.images]);

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
        .filter((variant: any) => variant?.is_active === true)
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
            image_url: variant.image_url || undefined,
            is_active: variant.is_active,
            stock_count: variant.stock_count,
          })) || [],
        description: rawProduct.description || '',
        whatsIncluded: rawProduct.whats_included || null,
        shippingDays: rawProduct.shipping_days || rawProduct.shipping_estimate || '7-12 days',
        warehouse: rawProduct.warehouse || 'CN',
        warehouse_status: rawProduct.warehouse_status || null,
        isDigital: !!(rawProduct.digital_file_path || rawProduct.mi_categories?.slug === 'digital-downloads'),
        inStock: rawProduct.cj_pid
          ? rawProduct.status === 'active'
          : rawProduct.stock_count > 0,
        stockCount: rawProduct.stock_count || 0,
        videoUrl: rawProduct.video_url || null,
        videos: rawProduct.videos || null,
      };

      setProduct(mappedProduct);
      setGalleryIndex(0);

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
        whatsIncluded: item.whats_included || null,
        shippingDays: item.shipping_days || item.shipping_estimate || '7-12 days',
        warehouse: item.warehouse || 'CN',
        warehouse_status: item.warehouse_status || null,
        isDigital: !!(item.digital_file_path || item.mi_categories?.slug === 'digital-downloads' || item.stock_count >= 9999),
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

  // Variant-driven pricing: use selected variant's retail_price, fall back to product-level price
  const effectivePrice = selectedVariant?.price ?? product.price;
  // Discount badge recalculates automatically: (compareAt - effectivePrice) / compareAt
  const effectiveCompareAtPrice = product.compareAtPrice;
  // True when variants exist and have mixed prices (show "from" label)
  const hasVariantPriceRange =
    product.variants.length > 1 &&
    new Set(product.variants.map((v) => v.price)).size > 1;

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
      warehouse_status: product.warehouse_status,
      isDigital: product.isDigital,
      shippingDays: product.shippingDays || null,
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
    if (product.isDigital || product.stockCount >= 9999) return null;
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
              videoUrl={product.videoUrl}
              videos={product.videos}
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

              <div className="mb-6 flex items-baseline gap-2">
                {hasVariantPriceRange && !selectedVariant && (
                  <span className="text-sm text-warm-500">From</span>
                )}
                <PriceDisplay
                  price={effectivePrice}
                  compareAtPrice={effectiveCompareAtPrice}
                  size="lg"
                />
              </div>
              {!product.isDigital && viewingCount ? (
                <div className="flex items-center gap-2 text-xs text-warm-500 mb-6">
                  <Eye className="w-4 h-4" />
                  <span>{viewingCount} people are viewing this right now</span>
                </div>
              ) : null}

              {product.warehouse_status === 'DIGITAL' || product.isDigital ? (
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
                        Instant download — delivered to your email
                      </p>
                    </div>
                  </div>
                </div>
              ) : product.warehouse_status === 'US' ? (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Truck className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-green-800">
                        Delivered in {product.shippingDays}
                      </p>
                      <p className="text-xs text-green-600">
                        {product.warehouse === 'CN' ? 'Ships internationally' : 'Ships from United States'} · Free shipping on orders $50+
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Globe className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-800">
                        Delivered in {product.shippingDays}
                      </p>
                      <p className="text-xs text-amber-600">
                        {product.warehouse === 'CN' ? 'Ships internationally' : 'Ships from United States'} · Free shipping on orders $50+
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {product.variants.length > 0 && (
                <div className="mb-6">
                  <VariantSelector
                    matrix={matrix}
                    selectedColor={selectedColor}
                    selectedSize={selectedSize}
                    onColorChange={handleColorChange}
                    onSizeChange={handleSizeChange}
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
                {product.whatsIncluded && product.whatsIncluded.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">
                      What&apos;s Included
                    </p>
                    <ul className="space-y-1">
                      {product.whatsIncluded.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-700">
                          <span style={{ color: '#c8a45e' }}>&#10003;</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-gray-100 mt-4" />
                  </div>
                )}
                <DescriptionFormatter
                  html={cleanDescription}
                  productName={product.name}
                  categoryName={product.categoryLabel}
                />
              </div>

              <Accordion type="single" collapsible className="mt-6">
                <AccordionItem value="shipping">
                  <AccordionTrigger>
                    {product.warehouse_status === 'DIGITAL' || product.isDigital ? 'Delivery Information' : 'Shipping Information'}
                  </AccordionTrigger>
                  <AccordionContent>
                    {product.warehouse_status === 'DIGITAL' || product.isDigital ? (
                      <div className="space-y-2 text-warm-700">
                        <p>
                          <strong>Delivery:</strong> Instant download — delivered to your email
                        </p>
                        <p>
                          Download links are available on the order confirmation page and in your order history.
                          A link is also included in your confirmation email.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 text-warm-700">
                        <p>
                          <strong>Estimated delivery:</strong> {product.shippingDays}
                        </p>
                        <p>
                          {product.warehouse_status === 'US' ? 'Ships from United States.' : 'Ships internationally.'}{' '}
                          Free shipping on orders over $50.
                        </p>
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
                        {review.verified_purchase === true && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                            <ShieldCheck size={11} />
                            Verified Purchase
                          </span>
                        )}
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

            <div className="mt-10 border-t border-gray-200 pt-8">
              <h3 style={{fontFamily: 'Playfair Display, serif'}} className="text-xl font-semibold text-[#0f1629] mb-1">
                Write a Review
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                Only verified purchasers can leave a review.
              </p>

              {!reviewFormOpen && !reviewResult?.success && (
                <button
                  onClick={() => setReviewFormOpen(true)}
                  className="text-sm font-medium text-[#c8a45e] hover:underline"
                >
                  Leave a Review &darr;
                </button>
              )}

              {reviewFormOpen && !reviewResult?.success && (
                <div className="space-y-4 max-w-lg">
                  <div>
                    <label className="block text-sm font-medium text-[#0f1629] mb-1">
                      Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-0.5 focus:outline-none"
                          aria-label={`Rate ${star} stars`}
                        >
                          <Star
                            size={24}
                            className={star <= reviewRating
                              ? 'text-[#c8a45e] fill-[#c8a45e]'
                              : 'text-gray-300'}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0f1629] mb-1">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={reviewName}
                      onChange={e => setReviewName(e.target.value)}
                      maxLength={50}
                      placeholder="First name or nickname"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0f1629] mb-1">
                      Order Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={reviewEmail}
                      onChange={e => setReviewEmail(e.target.value)}
                      placeholder="Email used at checkout"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e]"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Must match the email from your order confirmation.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0f1629] mb-1">
                      Your Review <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={reviewText}
                      onChange={e => setReviewText(e.target.value.slice(0, 1000))}
                      rows={4}
                      placeholder="What did you think of this product?"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#c8a45e] resize-none"
                    />
                    <p className="text-xs text-gray-400 text-right mt-0.5">
                      {reviewText.length} / 1000
                    </p>
                  </div>

                  {reviewResult && !reviewResult.success && (
                    <p className="text-sm text-red-600">{reviewResult.message}</p>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (!reviewRating) { setReviewResult({success: false, message: 'Please select a star rating.'}); return; }
                        if (reviewText.trim().length < 10) { setReviewResult({success: false, message: 'Review must be at least 10 characters.'}); return; }
                        if (!reviewName.trim()) { setReviewResult({success: false, message: 'Please enter your name.'}); return; }
                        if (!reviewEmail.trim()) { setReviewResult({success: false, message: 'Please enter your order email.'}); return; }

                        setReviewSubmitting(true);
                        setReviewResult(null);

                        try {
                          const res = await fetch('/api/reviews/submit', {
                            method: 'POST',
                            headers: {'Content-Type': 'application/json'},
                            body: JSON.stringify({
                              productId: product.id,
                              rating: reviewRating,
                              reviewText: reviewText.trim(),
                              reviewerName: reviewName.trim(),
                              reviewerEmail: reviewEmail.trim()
                            })
                          });
                          const data = await res.json();
                          if (res.ok) {
                            setReviewResult({success: true, message: 'Your review has been submitted. Thank you!'});
                            setReviewFormOpen(false);
                          } else {
                            setReviewResult({success: false, message: data.error || 'Something went wrong. Please try again.'});
                          }
                        } catch {
                          setReviewResult({success: false, message: 'Something went wrong. Please try again.'});
                        } finally {
                          setReviewSubmitting(false);
                        }
                      }}
                      disabled={reviewSubmitting}
                      className="flex-1 bg-[#0f1629] text-[#f7f6f3] text-sm font-medium py-2.5 rounded-lg hover:bg-[#1a2540] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {reviewSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                    <button
                      onClick={() => { setReviewFormOpen(false); setReviewResult(null); }}
                      className="px-4 text-sm text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {reviewResult?.success && (
                <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm max-w-lg">
                  <ShieldCheck size={16} />
                  {reviewResult.message}
                </div>
              )}
            </div>
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
              <PriceDisplay price={effectivePrice} compareAtPrice={effectiveCompareAtPrice} size="sm" />
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
