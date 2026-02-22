import React from 'react';
import { cn } from '@/lib/utils';

type StatusType =
  | 'active'
  | 'inactive'
  | 'out_of_stock'
  | 'low_stock'
  | 'pending'
  | 'hidden'
  | 'paid'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'unfulfilled'
  | 'refunded'
  | 'paused'
  | 'ended'
  | 'draft';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

const STATUS_CONFIG: Record<StatusType, { label: string; className: string }> = {
  active: {
    label: 'Active',
    className: 'bg-success/15 text-success border-success/30',
  },
  inactive: {
    label: 'Inactive',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
  out_of_stock: {
    label: 'Out of Stock',
    className: 'bg-danger/15 text-danger border-danger/30',
  },
  low_stock: {
    label: 'Low Stock',
    className: 'bg-warning/15 text-warning border-warning/30',
  },
  pending: {
    label: 'Pending',
    className: 'bg-gray-100 text-gray-700 border-gray-200',
  },
  hidden: {
    label: 'Deactivated',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
  paid: {
    label: 'Paid',
    className: 'bg-gold-500/15 text-gold-500 border-gold-500/30',
  },
  processing: {
    label: 'Processing',
    className: 'bg-warning/15 text-warning border-warning/30',
  },
  shipped: {
    label: 'Shipped',
    className: 'bg-[#3b82c4]/15 text-[#3b82c4] border-[#3b82c4]/30',
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-success/15 text-success border-success/30',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-danger/15 text-danger border-danger/30',
  },
  unfulfilled: {
    label: 'Unfulfilled',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
  refunded: {
    label: 'Refunded',
    className: 'bg-danger/15 text-danger border-danger/30',
  },
  paused: {
    label: 'Paused',
    className: 'bg-warning/15 text-warning border-warning/30',
  },
  ended: {
    label: 'Ended',
    className: 'bg-gray-100 text-gray-500 border-gray-200',
  },
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-md border text-xs font-semibold',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
