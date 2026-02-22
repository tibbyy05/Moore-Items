'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

const typeStyles: Record<ToastType, { ring: string; icon: string }> = {
  success: { ring: 'border-success/40', icon: 'text-success' },
  info: { ring: 'border-blue-400/40', icon: 'text-blue-500' },
  warning: { ring: 'border-warning/50', icon: 'text-warning' },
  error: { ring: 'border-danger/50', icon: 'text-danger' },
};

interface ToastProps {
  toast: ToastItem;
  onDismiss: () => void;
}

export function Toast({ toast, onDismiss }: ToastProps) {
  return (
    <div
      className={cn(
        'pointer-events-auto w-[320px] sm:w-[360px] rounded-2xl border bg-white shadow-xl',
        'p-4 text-left animate-toast-in',
        typeStyles[toast.type].ring
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-warm-900">{toast.title}</p>
          {toast.description && (
            <p className="text-sm text-warm-600 mt-1">{toast.description}</p>
          )}
        </div>
        <button
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="p-1 rounded-full hover:bg-warm-50 transition-colors"
        >
          <X className={cn('w-4 h-4', typeStyles[toast.type].icon)} />
        </button>
      </div>
    </div>
  );
}
