'use client';

import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white border border-warm-100 rounded-2xl overflow-hidden shadow-sm animate-pulse">
      <div className="aspect-square bg-warm-100" />
      <div className="p-4 space-y-3">
        <div className="h-3 w-24 bg-warm-100 rounded" />
        <div className="h-4 w-3/4 bg-warm-100 rounded" />
        <div className="h-4 w-1/2 bg-warm-100 rounded" />
        <div className="h-3 w-28 bg-warm-100 rounded" />
      </div>
    </div>
  );
}
