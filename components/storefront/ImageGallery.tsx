'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageGalleryProps {
  images: string[];
  productName: string;
  activeImageIndex?: number;
}

export function ImageGallery({ images, productName, activeImageIndex }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);
  const seen = new Set<string>();
  const galleryImages = images.filter((image) => {
    if (typeof image !== 'string' || image.trim().length === 0) return false;
    if (seen.has(image)) return false;
    seen.add(image);
    return true;
  });

  useEffect(() => {
    if (
      activeImageIndex !== undefined &&
      activeImageIndex >= 0 &&
      activeImageIndex < galleryImages.length
    ) {
      setActiveIndex(activeImageIndex);
    }
  }, [activeImageIndex]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxOpen(false);
      if (event.key === 'ArrowRight') handleNext();
      if (event.key === 'ArrowLeft') handlePrev();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = 'unset';
    };
  }, [lightboxOpen, activeIndex]);

  useEffect(() => {
    if (activeIndex >= galleryImages.length) {
      setActiveIndex(0);
    }
  }, [galleryImages.length, activeIndex]);

  const handleNext = () => {
    if (galleryImages.length === 0) return;
    setActiveIndex((prev) => {
      const next = (prev + 1) % galleryImages.length;
      return next;
    });
  };

  const handlePrev = () => {
    if (galleryImages.length === 0) return;
    setActiveIndex((prev) => {
      const next = (prev - 1 + galleryImages.length) % galleryImages.length;
      return next;
    });
  };

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) < 40) return;
    if (delta > 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (!thumbnailStripRef.current) return;
    const scrollAmount = 160;
    thumbnailStripRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const activeImage =
    galleryImages[activeIndex] || galleryImages[0] || '/placeholder.svg';

  return (
    <div>
      <button
        type="button"
        className="relative w-full aspect-square rounded-2xl overflow-hidden bg-warm-50 border border-warm-100 cursor-pointer"
        onClick={() => setLightboxOpen(true)}
        aria-label="Zoom product image"
      >
        <Image
          src={activeImage}
          alt={productName}
          fill
          className="object-cover"
          sizes="(max-width: 1024px) 100vw, 50vw"
          unoptimized
        />
      </button>

      <div className="mt-4 flex items-center gap-2 w-full">
        {galleryImages.length > 5 && (
          <button
            type="button"
            onClick={() => scrollThumbnails('left')}
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full border border-warm-200 text-warm-600 hover:text-warm-900 hover:border-warm-400 transition"
            aria-label="Scroll thumbnails left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
        <div
          ref={thumbnailStripRef}
          className="flex flex-nowrap gap-2 overflow-x-auto pb-2 w-full [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {galleryImages.map((image, index) => (
          <button
            key={`${image}-${index}`}
            type="button"
            className={cn(
              'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors',
              index === activeIndex
                ? 'border-gold-500'
                : 'border-transparent hover:border-warm-300'
            )}
            onClick={() => {
              setActiveIndex(index);
            }}
            aria-label={`View image ${index + 1}`}
          >
            <Image
              src={image}
              alt={`${productName} thumbnail ${index + 1}`}
              width={64}
              height={64}
              className="object-cover w-full h-full"
              unoptimized
            />
          </button>
          ))}
        </div>
        {galleryImages.length > 5 && (
          <button
            type="button"
            onClick={() => scrollThumbnails('right')}
            className="hidden sm:inline-flex items-center justify-center w-9 h-9 rounded-full border border-warm-200 text-warm-600 hover:text-warm-900 hover:border-warm-400 transition"
            aria-label="Scroll thumbnails right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {mounted &&
        createPortal(
          <div
            className={cn(
              'fixed inset-0 z-50 flex items-center justify-center p-4',
              lightboxOpen ? 'pointer-events-auto' : 'pointer-events-none'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 bg-navy-950/70 backdrop-blur-sm transition-opacity',
                lightboxOpen ? 'opacity-100' : 'opacity-0'
              )}
              onClick={() => setLightboxOpen(false)}
            />
            <div
              className={cn(
                'relative w-full h-full max-w-6xl max-h-[90vh] rounded-2xl overflow-hidden shadow-2xl bg-black',
                lightboxOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95',
                'transition-all duration-200'
              )}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <button
                onClick={() => setLightboxOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow"
                aria-label="Close image viewer"
              >
                <X className="w-5 h-5 text-warm-600" />
              </button>
              <div className="absolute top-4 left-4 z-10 text-xs font-semibold text-white bg-black/50 px-2.5 py-1 rounded-full">
                {activeIndex + 1} / {Math.max(galleryImages.length, 1)}
              </div>
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5 text-warm-700" />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/90 hover:bg-white shadow"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5 text-warm-700" />
              </button>
              <div className="relative w-full h-full bg-black">
                <Image
                  src={activeImage}
                  alt={productName}
                  fill
                  className="object-contain"
                  sizes="(max-width: 1024px) 100vw, 80vw"
                  unoptimized
                />
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
