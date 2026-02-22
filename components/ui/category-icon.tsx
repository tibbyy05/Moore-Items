import React from 'react';
import {
  Shirt,
  PawPrint,
  Home,
  Sparkles,
  Gem,
  Smartphone,
  Baby,
  UtensilsCrossed,
  LucideIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, LucideIcon> = {
  Shirt,
  PawPrint,
  Home,
  Sparkles,
  Gem,
  Smartphone,
  Baby,
  UtensilsCrossed,
};

interface CategoryIconProps {
  iconName: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  strokeWidth?: number;
}

export function CategoryIcon({
  iconName,
  className,
  size = 'md',
  strokeWidth = 1.75
}: CategoryIconProps) {
  const Icon = ICON_MAP[iconName];

  if (!Icon) {
    return null;
  }

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  return <Icon className={cn(sizeClasses[size], className)} strokeWidth={strokeWidth} />;
}
