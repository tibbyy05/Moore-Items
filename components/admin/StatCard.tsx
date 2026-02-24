import React from 'react';
import { LucideIcon, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string;
  change?: {
    value: number;
    isPositive: boolean;
  };
  icon: LucideIcon;
  iconBgClassName?: string;
  iconClassName?: string;
  className?: string;
}

export function StatCard({ label, value, change, icon: Icon, iconBgClassName, iconClassName, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'bg-white border border-gray-200 rounded-2xl p-5 relative shadow-sm',
        className
      )}
    >
      <div className={cn("absolute top-5 right-5 w-10 h-10 rounded-lg flex items-center justify-center", iconBgClassName || "bg-gold-50")}>
        <Icon className={cn("w-5 h-5", iconClassName || "text-gold-500")} strokeWidth={2} />
      </div>

      <p className="text-sm font-medium text-gray-500 mb-2">{label}</p>
      <p className="text-[28px] font-bold text-[#1a1a2e] mb-2 font-variant-tabular">
        {value}
      </p>

      {change && (
        <div className="flex items-center gap-1.5">
          {change.isPositive ? (
            <ArrowUpRight className="w-3.5 h-3.5 text-success" />
          ) : (
            <ArrowDownRight className="w-3.5 h-3.5 text-danger" />
          )}
          <span
            className={cn(
              'text-xs font-semibold',
              change.isPositive ? 'text-success' : 'text-danger'
            )}
          >
            {change.isPositive ? '+' : ''}{change.value}%
          </span>
          <span className="text-xs text-gray-500">vs yesterday</span>
        </div>
      )}
    </div>
  );
}
