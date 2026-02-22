import React from 'react';
import { cn } from '@/lib/utils';
import { Sparkles, TrendingUp, Tag, Star } from 'lucide-react';

export type BadgeType = 'NEW' | 'TRENDING' | 'SALE' | 'BESTSELLER' | null;

interface BadgeProps {
  type: BadgeType;
  className?: string;
}

export function CustomBadge({ type, className }: BadgeProps) {
  if (!type) return null;

  const config = {
    NEW: {
      icon: Sparkles,
      text: 'NEW',
      className: 'bg-success/15 text-success border-success/30',
    },
    TRENDING: {
      icon: TrendingUp,
      text: 'TRENDING',
      className: 'bg-gold-500/15 text-gold-600 border-gold-500/30',
    },
    SALE: {
      icon: Tag,
      text: 'SALE',
      className: 'bg-danger/15 text-danger border-danger/30',
    },
    BESTSELLER: {
      icon: Star,
      text: 'BESTSELLER',
      className: 'bg-gold-500/15 text-gold-600 border-gold-500/30',
    },
  };

  const { icon: Icon, text, className: typeClassName } = config[type];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 px-2 py-1 rounded-md border text-[10px] font-bold uppercase tracking-widest',
        typeClassName,
        className
      )}
    >
      <Icon className="w-3 h-3" />
      {text}
    </div>
  );
}
