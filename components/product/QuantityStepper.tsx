'use client';

import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuantityStepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  className,
}: QuantityStepperProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value, 10);
    if (!isNaN(newValue) && newValue >= min && newValue <= max) {
      onChange(newValue);
    }
  };

  const sizeClasses = {
    sm: {
      button: 'w-7 h-7',
      input: 'w-10 h-7 text-sm',
      icon: 'w-3 h-3',
    },
    md: {
      button: 'w-9 h-9',
      input: 'w-12 h-9 text-base',
      icon: 'w-4 h-4',
    },
    lg: {
      button: 'w-11 h-11',
      input: 'w-14 h-11 text-lg',
      icon: 'w-5 h-5',
    },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <button
        onClick={handleDecrement}
        disabled={value <= min}
        className={cn(
          'flex items-center justify-center rounded-lg border border-navy-200 bg-white text-navy-900 transition-colors hover:border-gold-500 hover:text-gold-600 disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size].button
        )}
        aria-label="Decrease quantity"
      >
        <Minus className={sizeClasses[size].icon} />
      </button>

      <input
        type="number"
        value={value}
        onChange={handleInputChange}
        min={min}
        max={max}
        className={cn(
          'text-center border border-navy-200 rounded-lg font-semibold text-navy-900 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent font-variant-tabular',
          sizeClasses[size].input
        )}
        aria-label="Quantity"
      />

      <button
        onClick={handleIncrement}
        disabled={value >= max}
        className={cn(
          'flex items-center justify-center rounded-lg border border-navy-200 bg-white text-navy-900 transition-colors hover:border-gold-500 hover:text-gold-600 disabled:opacity-50 disabled:cursor-not-allowed',
          sizeClasses[size].button
        )}
        aria-label="Increase quantity"
      >
        <Plus className={sizeClasses[size].icon} />
      </button>
    </div>
  );
}
