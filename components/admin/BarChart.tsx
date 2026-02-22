'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface BarChartData {
  label: string;
  value: number;
  isToday?: boolean;
}

interface BarChartProps {
  data: BarChartData[];
  height?: number;
  className?: string;
}

export function BarChart({ data, height = 240, className }: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end justify-between gap-4" style={{ height: `${height}px` }}>
        {data.map((item, index) => {
          const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 40) : 0;

          return (
            <div key={index} className="flex-1 flex flex-col items-center justify-end group">
              <div className="relative w-full mb-2">
                {item.value > 0 && (
                  <div
                    className="absolute bottom-0 left-0 right-0 text-[11px] font-semibold text-gray-600 text-center mb-1"
                    style={{ bottom: `${barHeight + 4}px` }}
                  >
                    ${item.value.toFixed(0)}
                  </div>
                )}
                <div
                  className={cn(
                    'w-full rounded-t-md transition-all duration-300 hover:opacity-80 cursor-pointer',
                    item.isToday
                      ? 'bg-gradient-to-t from-gold-600 to-gold-500'
                      : 'bg-gradient-to-t from-gray-300 to-gray-400'
                  )}
                  style={{ height: `${barHeight}px` }}
                />
              </div>
              <span
                className={cn(
                  'text-xs font-medium',
                  item.isToday ? 'text-gold-500 font-bold' : 'text-gray-500'
                )}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
