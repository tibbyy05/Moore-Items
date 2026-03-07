'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LandingPageBuilder } from '@/components/admin/LandingPageBuilder';

export default function NewLandingPage() {
  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/landing-pages"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gold-500 mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Landing Pages
        </Link>
        <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">
          New Landing Page
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Create a high-converting landing page for a product
        </p>
      </div>
      <LandingPageBuilder />
    </>
  );
}
