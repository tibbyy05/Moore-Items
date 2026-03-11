'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface HeroProduct {
  id: string;
  slug: string;
  name: string;
  image: string;
}

interface SlotPool {
  items: HeroProduct[];
  index: number;
}

export function HeroGrid({ pool }: { pool: HeroProduct[] }) {
  // Each slot gets its own pool; initialize from the fallback pool
  const [slotPools, setSlotPools] = useState<Record<number, SlotPool>>(() => ({
    1: { items: pool.slice(0, 1), index: 0 },
    2: { items: pool.slice(1, 2), index: 0 },
    3: { items: pool.slice(2, 3), index: 0 },
    4: { items: pool.slice(3, 4), index: 0 },
  }));
  const [current, setCurrent] = useState<HeroProduct[]>(() => pool.slice(0, 4));
  const [fadingSlot, setFadingSlot] = useState<number | null>(null);
  const slotPoolsRef = useRef(slotPools);
  slotPoolsRef.current = slotPools;

  // Fetch curated per-slot data, fall back per-slot
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/hero-images');
        if (!res.ok) return;
        const data = await res.json();
        const apiItems: Array<HeroProduct & { slot: number }> = (data.items || [])
          .filter((i: any) => i.image && i.slug)
          .map((i: any) => ({
            id: i.id,
            slug: i.slug,
            name: i.name,
            image: i.image,
            slot: i.slot,
          }));
        if (cancelled) return;

        // Group by slot
        const grouped: Record<number, HeroProduct[]> = { 1: [], 2: [], 3: [], 4: [] };
        for (const item of apiItems) {
          if (grouped[item.slot]) grouped[item.slot].push(item);
        }

        // Build pools per slot, falling back to auto pool for empty slots
        const newPools: Record<number, SlotPool> = {} as any;
        const newCurrent: HeroProduct[] = [];
        for (let s = 1; s <= 4; s++) {
          const slotItems = grouped[s].length > 0 ? grouped[s] : (pool[s - 1] ? [pool[s - 1]] : []);
          newPools[s] = { items: slotItems, index: 0 };
          newCurrent.push(slotItems[0] || pool[s - 1] || { id: '', slug: '', name: '', image: '' });
        }

        setSlotPools(newPools);
        setCurrent(newCurrent);
      } catch {
        // keep fallback
      }
    })();
    return () => { cancelled = true; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Independent rotation per slot, staggered by 1s
  useEffect(() => {
    const timers: ReturnType<typeof setInterval>[] = [];

    for (let s = 1; s <= 4; s++) {
      const slotIndex = s - 1;
      const delay = (s - 1) * 1000; // stagger: 0s, 1s, 2s, 3s

      const startTimer = () => {
        const interval = setInterval(() => {
          const sp = slotPoolsRef.current[s];
          if (!sp || sp.items.length <= 1) return;

          setFadingSlot(slotIndex);

          setTimeout(() => {
            setSlotPools((prev) => {
              const pool = prev[s];
              if (!pool || pool.items.length <= 1) return prev;
              const nextIdx = (pool.index + 1) % pool.items.length;
              return { ...prev, [s]: { ...pool, index: nextIdx } };
            });
            setCurrent((prev) => {
              const sp = slotPoolsRef.current[s];
              if (!sp || sp.items.length <= 1) return prev;
              const nextIdx = (sp.index + 1) % sp.items.length;
              const updated = [...prev];
              updated[slotIndex] = sp.items[nextIdx];
              return updated;
            });
            setFadingSlot(null);
          }, 500);
        }, 4000);
        timers.push(interval);
      };

      if (delay > 0) {
        const t = setTimeout(startTimer, delay);
        // Store cleanup — cast to satisfy the array type, clean up in return
        timers.push(t as unknown as ReturnType<typeof setInterval>);
      } else {
        startTimer();
      }
    }

    return () => {
      timers.forEach((t) => clearInterval(t));
    };
  }, []); // runs once; reads from ref

  // Layout: slot 0 = tall left, slot 1 = top right, slot 2 = bottom right small, slot 3 = bottom right small
  return (
    <div className="w-full h-full grid grid-cols-2 grid-rows-[1fr_1fr] gap-2.5">
      {/* Slot 0: tall left spanning both rows */}
      <Link
        href={`/product/${current[0]?.slug}`}
        className="relative row-span-2 overflow-hidden rounded-2xl group ring-1 ring-white/10"
      >
        <Image
          src={current[0]?.image || ''}
          alt={current[0]?.name || ''}
          fill
          className="object-cover object-center transition-all duration-500 group-hover:scale-105"
          style={{ opacity: fadingSlot === 0 ? 0 : 1 }}
          sizes="(max-width: 1024px) 50vw, 25vw"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
        <span className="absolute bottom-4 left-4 right-4 text-sm font-medium text-white/90 line-clamp-2 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          {current[0]?.name}
        </span>
      </Link>

      {/* Slot 1: top right */}
      <Link
        href={`/product/${current[1]?.slug}`}
        className="relative overflow-hidden rounded-2xl group ring-1 ring-white/10"
      >
        <Image
          src={current[1]?.image || ''}
          alt={current[1]?.name || ''}
          fill
          className="object-cover object-center transition-all duration-500 group-hover:scale-105"
          style={{ opacity: fadingSlot === 1 ? 0 : 1 }}
          sizes="(max-width: 1024px) 50vw, 25vw"
          unoptimized
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
        <span className="absolute bottom-3 left-3 right-3 text-sm font-medium text-white/90 line-clamp-1 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          {current[1]?.name}
        </span>
      </Link>

      {/* Slot 2 & 3: bottom right, split horizontally */}
      <div className="grid grid-cols-2 gap-2.5">
        {[2, 3].map((i) => (
          <Link
            key={`hero-slot-${i}`}
            href={`/product/${current[i]?.slug}`}
            className="relative overflow-hidden rounded-2xl group ring-1 ring-white/10"
          >
            <Image
              src={current[i]?.image || ''}
              alt={current[i]?.name || ''}
              fill
              className="object-cover object-center transition-all duration-500 group-hover:scale-105"
              style={{ opacity: fadingSlot === i ? 0 : 1 }}
              sizes="(max-width: 1024px) 25vw, 12vw"
              unoptimized
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/60 via-transparent to-transparent" />
          </Link>
        ))}
      </div>
    </div>
  );
}
