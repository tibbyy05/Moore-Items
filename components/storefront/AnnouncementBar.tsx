'use client';

import React from 'react';

const MESSAGES = [
  '🔒 100% Secure Checkout',
  '📦 Fast 2–5 Day US Delivery',
  '🚚 Free Shipping on $50+',
  '⭐ 6,000+ Five-Star Reviews',
];

export function AnnouncementBar() {
  return (
    <div className="bg-[#0f1629] text-white text-[11px] sm:text-xs tracking-widest overflow-hidden">
      <div className="h-9 flex items-center overflow-hidden">
        <div className="flex animate-ticker whitespace-nowrap">
          {MESSAGES.map((message, index) => (
            <div key={`a-${index}`} className="flex items-center gap-3 px-6">
              <span>{message}</span>
              <span className="text-[#c8a45e]">•</span>
            </div>
          ))}
          {MESSAGES.map((message, index) => (
            <div key={`b-${index}`} className="flex items-center gap-3 px-6">
              <span>{message}</span>
              <span className="text-[#c8a45e]">•</span>
            </div>
          ))}
          {MESSAGES.map((message, index) => (
            <div key={`c-${index}`} className="flex items-center gap-3 px-6">
              <span>{message}</span>
              <span className="text-[#c8a45e]">•</span>
            </div>
          ))}
          {MESSAGES.map((message, index) => (
            <div key={`d-${index}`} className="flex items-center gap-3 px-6">
              <span>{message}</span>
              <span className="text-[#c8a45e]">•</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
