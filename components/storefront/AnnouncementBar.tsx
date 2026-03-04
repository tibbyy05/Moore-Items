'use client';

import React from 'react';

const MESSAGES = [
  '🚚 Free US Shipping on Orders $50+',
  '📦 Fast 2-5 Business Day Delivery',
  '📦 Fast 2-5 Day US Shipping • 🌐 International Options Available',
];

export function AnnouncementBar() {
  return (
    <div className="bg-[#0f1629] text-white text-[11px] sm:text-xs uppercase tracking-widest overflow-hidden">
      <div className="relative h-9 flex items-center">
        <div className="absolute inset-0 flex items-center">
          <div className="marquee flex items-center">
            {[...MESSAGES, ...MESSAGES].map((message, index) => (
              <div
                key={`${message}-${index}`}
                className="flex items-center gap-3 px-6 whitespace-nowrap"
              >
                <span>{message}</span>
                <span className="text-[#c8a45e]">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style jsx>{`
        .marquee {
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% {
            transform: translateX(-50%);
          }
          100% {
            transform: translateX(0%);
          }
        }
      `}</style>
    </div>
  );
}
