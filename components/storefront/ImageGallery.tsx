'use client';

import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight, Play, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoEntry {
  cloudflare_id: string;
  url: string;
  status: 'processing' | 'ready';
  thumbnail: string;
  sort_order: number;
}

interface ImageGalleryProps {
  images: string[];
  productName: string;
  activeImageIndex?: number;
  videoUrl?: string | null;
  videos?: VideoEntry[] | null;
}

export function ImageGallery({ images, productName, activeImageIndex, videoUrl, videos }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
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

  // Build sorted ready videos list (from videos array, falling back to legacy videoUrl)
  const readyVideos: VideoEntry[] = (() => {
    if (videos && videos.length > 0) {
      return [...videos]
        .filter((v) => v.status === 'ready')
        .sort((a, b) => a.sort_order - b.sort_order);
    }
    // Legacy fallback: single videoUrl
    if (videoUrl) {
      return [{
        cloudflare_id: 'legacy',
        url: videoUrl,
        status: 'ready' as const,
        thumbnail: '',
        sort_order: 0,
      }];
    }
    return [];
  })();

  const processingVideos: VideoEntry[] = videos
    ? videos.filter((v) => v.status === 'processing').sort((a, b) => a.sort_order - b.sort_order)
    : [];

  useEffect(() => {
    if (
      activeImageIndex !== undefined &&
      activeImageIndex >= 0 &&
      activeImageIndex < galleryImages.length
    ) {
      setActiveIndex(activeImageIndex);
      setActiveVideoUrl(null);
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
    setActiveIndex((prev) => (prev + 1) % galleryImages.length);
  };

  const handlePrev = () => {
    if (galleryImages.length === 0) return;
    setActiveIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);
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
    if (delta > 0) handleNext();
    else handlePrev();
  };

  const scrollThumbnails = (direction: 'left' | 'right') => {
    if (!thumbnailStripRef.current) return;
    thumbnailStripRef.current.scrollBy({
      left: direction === 'left' ? -160 : 160,
      behavior: 'smooth',
    });
  };

  const activeImage =
    galleryImages[activeIndex] || galleryImages[0] || '/placeholder.svg';

  const totalThumbnails = readyVideos.length + processingVideos.length + galleryImages.length;

  return (
    <div>
      {/* Main display area — constrained on mobile so product info is visible above fold */}
      <div className="relative w-full h-[40vh] md:h-auto md:aspect-square md:max-h-none rounded-2xl overflow-hidden border border-warm-100 bg-black">
        {activeVideoUrl ? (
          <iframe
            src={`${activeVideoUrl}?autoplay=true&muted=true&loop=true&controls=true`}
            className="w-full h-full"
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="w-full h-full bg-white cursor-pointer"
            onClick={() => setLightboxOpen(true)}
            aria-label="Zoom product image"
          >
            <Image
              src={activeImage}
              alt={`${productName} - Image ${activeIndex + 1} of ${galleryImages.length}`}
              fill
              className="object-contain md:object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              unoptimized
            />
          </button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div className="mt-4 flex items-center gap-2 w-full min-w-0">
        {totalThumbnails > 5 && (
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
          className="flex flex-nowrap gap-2 overflow-x-auto pb-2 w-full min-w-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {/* Ready video thumbnails — before images */}
          {readyVideos.map((video) => (
            <button
              key={video.cloudflare_id}
              type="button"
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors bg-navy-900',
                activeVideoUrl === video.url
                  ? 'border-gold-500'
                  : 'border-transparent hover:border-warm-300'
              )}
              onClick={() => {
                setActiveVideoUrl(video.url);
              }}
              aria-label="Play product video"
            >
              {video.thumbnail ? (
                <img
                  src={video.thumbnail}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover opacity-70"
                />
              ) : galleryImages[0] ? (
                <Image
                  src={galleryImages[0]}
                  alt="Video thumbnail"
                  width={64}
                  height={64}
                  className="object-cover w-full h-full opacity-60"
                  unoptimized
                />
              ) : null}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 rounded-full bg-black/60 flex items-center justify-center">
                  <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </button>
          ))}

          {/* Processing video placeholders — not clickable */}
          {processingVideos.map((video) => (
            <div
              key={video.cloudflare_id}
              className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent bg-navy-900/80"
            >
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                <Clock className="w-3.5 h-3.5 text-warm-400 animate-pulse" />
                <span className="text-[8px] text-warm-400 font-medium">Soon</span>
              </div>
            </div>
          ))}

          {/* Image thumbnails */}
          {galleryImages.map((image, index) => (
            <button
              key={`${image}-${index}`}
              type="button"
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden cursor-pointer border-2 transition-colors bg-white',
                !activeVideoUrl && index === activeIndex
                  ? 'border-gold-500'
                  : 'border-transparent hover:border-warm-300'
              )}
              onClick={() => {
                setActiveIndex(index);
                setActiveVideoUrl(null);
              }}
              aria-label={`View image ${index + 1}`}
            >
              <Image
                src={image}
                alt={`${productName} - Image ${index + 1} of ${galleryImages.length}`}
                width={64}
                height={64}
                className="object-cover w-full h-full"
                unoptimized
              />
            </button>
          ))}
        </div>
        {totalThumbnails > 5 && (
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

      {/* Lightbox */}
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
                  alt={`${productName} - Image ${activeIndex + 1} of ${galleryImages.length}`}
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
