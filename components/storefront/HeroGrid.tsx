'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeroProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
}

export function HeroGrid({ pool }: { pool: HeroProduct[] }) {
  const [slots, setSlots] = useState<HeroProduct[]>(() => pool.slice(0, 4));
  const [fadingSlot, setFadingSlot] = useState<number | null>(null);
  const [nextSlotRef] = useState({ current: 0 });

  const cycleSlot = useCallback(() => {
    if (pool.length <= 4) return;

    const slotIndex = nextSlotRef.current;
    nextSlotRef.current = (nextSlotRef.current + 1) % 4;

    setFadingSlot(slotIndex);

    setTimeout(() => {
      setSlots((prev) => {
        const currentIds = new Set(prev.map((p) => p.id));
        const available = pool.filter((p) => !currentIds.has(p.id));
        if (available.length === 0) return prev;
        const next = available[Math.floor(Math.random() * available.length)];
        const updated = [...prev];
        updated[slotIndex] = next;
        return updated;
      });
      setFadingSlot(null);
    }, 400);
  }, [pool, nextSlotRef]);

  useEffect(() => {
    const interval = setInterval(cycleSlot, 4000);
    return () => clearInterval(interval);
  }, [cycleSlot]);

  return (
    <div className="grid grid-cols-2 max-[360px]:grid-cols-1 gap-4 h-full">
      {slots.map((product, i) => (
        <Link
          key={`hero-slot-${i}`}
          href={`/product/${product.slug}`}
          className="relative aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition"
        >
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-[400ms]"
            style={{ opacity: fadingSlot === i ? 0 : 1 }}
            sizes="(max-width: 1024px) 50vw, 25vw"
            unoptimized
            priority={i < 4}
          />
        </Link>
      ))}
    </div>
  );
}
