'use client';

import { useEffect, useMemo, useState } from 'react';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ExternalLink, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface LandingPageRow {
  id: string;
  name: string;
  slug: string;
  views: number;
  conversions: number;
  is_active: boolean;
  created_at: string;
}

export default function LandingPagesPage() {
  const supabase = createClient();
  const [landingPages, setLandingPages] = useState<LandingPageRow[]>([]);

  useEffect(() => {
    const fetchLandingPages = async () => {
      const { data } = await supabase
        .from('mi_landing_pages')
        .select('id, name, slug, views, conversions, is_active, created_at')
        .order('created_at', { ascending: false });

      setLandingPages((data as LandingPageRow[]) || []);
    };

    fetchLandingPages();
  }, [supabase]);

  const avgConversion = useMemo(() => {
    if (landingPages.length === 0) return 0;
    const totalRate = landingPages.reduce((sum, page) => {
      const rate = page.views > 0 ? (page.conversions / page.views) * 100 : 0;
      return sum + rate;
    }, 0);
    return totalRate / landingPages.length;
  }, [landingPages]);

  const totalViews = useMemo(
    () => landingPages.reduce((sum, page) => sum + page.views, 0),
    [landingPages]
  );

  const activePages = landingPages.filter((page) => page.is_active).length;
  return (
    <>
      <div className="mb-8">
        <div className="flex items-end justify-between mb-2">
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">Landing Pages</h1>
          <button disabled className="px-4 py-2 bg-gold-500 text-[#1a1a2e] text-sm font-semibold rounded-lg flex items-center gap-2 opacity-50 cursor-not-allowed">
            <Plus className="w-4 h-4" />
            New Landing Page (Coming Soon)
          </button>
        </div>
        <p className="text-sm text-gray-500">
          Create and manage campaign landing pages
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <span className="text-sm font-medium text-gray-500">Total Pages</span>
          <p className="text-3xl font-bold text-[#1a1a2e] mt-2">{landingPages.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <span className="text-sm font-medium text-gray-500">Active</span>
          <p className="text-3xl font-bold text-success mt-2">{activePages}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <span className="text-sm font-medium text-gray-500">Total Views</span>
          <p className="text-3xl font-bold text-[#1a1a2e] mt-2">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <span className="text-sm font-medium text-gray-500">Avg Conversion</span>
          <p className="text-3xl font-bold text-gold-500 mt-2">
            {avgConversion.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Page
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Campaign
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Conversions
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Conv. Rate
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {landingPages.map((page) => {
                const conversionRate =
                  page.views > 0 ? (page.conversions / page.views) * 100 : 0;
                const url = `/lp/${page.slug}`;
                return (
                  <tr
                    key={page.id}
                    className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-sm font-semibold text-[#1a1a2e] mb-1">{page.name}</p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gold-500 hover:text-gold-400 flex items-center gap-1 group"
                      >
                        {url}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
                      {page.slug}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#1a1a2e] font-variant-tabular">
                    {page.views.toLocaleString()}
                  </td>
                  <td className="py-4 px-4 text-right text-sm text-[#1a1a2e] font-variant-tabular">
                    {page.conversions}
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span
                      className={`text-sm font-semibold ${
                        conversionRate >= 5
                          ? 'text-success'
                          : conversionRate >= 3
                          ? 'text-warning'
                          : 'text-danger'
                      }`}
                    >
                      {conversionRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <StatusBadge status={page.is_active ? 'active' : 'inactive'} />
                  </td>
                  <td className="py-4 px-4 text-sm text-gray-600">
                    {new Date(page.created_at).toLocaleDateString()}
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
