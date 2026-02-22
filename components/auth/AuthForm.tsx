'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface AuthFormProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function AuthForm({ title, subtitle, children, footer, className }: AuthFormProps) {
  return (
    <main className="bg-white min-h-screen flex items-center justify-center px-4 py-12">
      <div className={cn('w-full max-w-md', className)}>
        <div className="flex justify-center mb-8">
          <Link href="/" className="inline-flex items-center">
            <Image
              src="/TransparentLogo.png"
              alt="MooreItems"
              width={560}
              height={190}
              className="w-auto h-14"
              priority
            />
          </Link>
        </div>
        <div className="bg-white border border-warm-200 rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-2xl font-playfair font-semibold text-warm-900 mb-2">{title}</h1>
          {subtitle && <p className="text-sm text-warm-600 mb-6">{subtitle}</p>}
          {children}
        </div>
        {footer && <div className="mt-6 text-center text-sm text-warm-600">{footer}</div>}
      </div>
    </main>
  );
}
