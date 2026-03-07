'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { LandingPageBuilder } from '@/components/admin/LandingPageBuilder';

export default function EditLandingPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/admin/landing-pages/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((d) => {
        setData(d.page);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="text-center py-20 text-sm text-gray-400">Loading...</div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-danger mb-3">Landing page not found</p>
        <Link
          href="/admin/landing-pages"
          className="text-sm text-gold-500 hover:text-gold-600 font-semibold"
        >
          Back to Landing Pages
        </Link>
      </div>
    );
  }

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
          Edit Landing Page
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {data.name}
        </p>
      </div>
      <LandingPageBuilder initialData={data} />
    </>
  );
}
