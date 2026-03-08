'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ExternalLink, Plus, Pencil, Trash2, Power } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface LandingPageRow {
  id: string;
  name: string;
  slug: string;
  product_ids: string[];
  views: number;
  conversions: number;
  is_active: boolean;
  created_at: string;
}

interface ProductMap {
  [id: string]: string;
}

export default function LandingPagesPage() {
  const supabase = createClient();
  const [landingPages, setLandingPages] = useState<LandingPageRow[]>([]);
  const [products, setProducts] = useState<ProductMap>({});
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: pages }, { data: prods }] = await Promise.all([
      supabase
        .from('mi_landing_pages')
        .select('id, name, slug, product_ids, views, conversions, is_active, created_at')
        .order('created_at', { ascending: false }),
      supabase.from('mi_products').select('id, name'),
    ]);

    setLandingPages((pages as LandingPageRow[]) || []);

    const lookup: ProductMap = {};
    (prods || []).forEach((p: any) => {
      lookup[p.id] = p.name;
    });
    setProducts(lookup);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getProductLabel = (productIds: string[] | null) => {
    if (!productIds || productIds.length === 0) return '—';
    const firstName = products[productIds[0]];
    if (!firstName) return '—';
    if (productIds.length === 1) return firstName;
    return `${firstName} +${productIds.length - 1} more`;
  };

  const handleToggle = async (page: LandingPageRow) => {
    setTogglingId(page.id);
    const { error } = await supabase
      .from('mi_landing_pages')
      .update({ is_active: !page.is_active, updated_at: new Date().toISOString() })
      .eq('id', page.id);

    if (error) {
      toast.error('Failed to update status');
    } else {
      toast.success(page.is_active ? 'Set to Draft' : 'Set to Live');
      setLandingPages((prev) =>
        prev.map((p) => (p.id === page.id ? { ...p, is_active: !p.is_active } : p))
      );
    }
    setTogglingId(null);
  };

  const handleDelete = async (page: LandingPageRow) => {
    if (!confirm(`Delete "${page.name}"? This cannot be undone.`)) return;

    setDeletingId(page.id);
    const { error } = await supabase
      .from('mi_landing_pages')
      .delete()
      .eq('id', page.id);

    if (error) {
      toast.error('Failed to delete landing page');
    } else {
      toast.success('Landing page deleted');
      setLandingPages((prev) => prev.filter((p) => p.id !== page.id));
    }
    setDeletingId(null);
  };

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
          <Link
            href="/admin/landing-pages/new"
            className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Landing Page
          </Link>
        </div>
        <p className="text-sm text-gray-500">Create and manage campaign landing pages</p>
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
          <p className="text-3xl font-bold text-gold-500 mt-2">{avgConversion.toFixed(1)}%</p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Status
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
                  Created
                </th>
                <th className="text-right py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-sm text-gray-400">
                    Loading...
                  </td>
                </tr>
              )}
              {!loading && landingPages.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-sm text-gray-400 mb-2">No landing pages yet</p>
                    <Link
                      href="/admin/landing-pages/new"
                      className="text-sm text-gold-500 hover:text-gold-600 font-semibold"
                    >
                      Create your first landing page
                    </Link>
                  </td>
                </tr>
              )}
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
                      <p className="text-sm font-semibold text-[#1a1a2e]">{page.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">/lp/{page.slug}</p>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm text-[#1a1a2e] max-w-[200px] truncate">
                        {getProductLabel(page.product_ids)}
                      </p>
                    </td>
                    <td className="py-4 px-4">
                      <StatusBadge status={page.is_active ? 'live' : 'draft'} />
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-[#1a1a2e] tabular-nums">
                      {page.views.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right text-sm text-[#1a1a2e] tabular-nums">
                      {page.conversions.toLocaleString()}
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
                    <td className="py-4 px-4 text-sm text-gray-600">
                      {new Date(page.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/landing-pages/${page.id}/edit`}
                          className="p-2 text-gray-400 hover:text-[#1a1a2e] hover:bg-gray-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </Link>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-gray-400 hover:text-gold-500 hover:bg-gold-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleToggle(page)}
                          disabled={togglingId === page.id}
                          className={`p-2 rounded-lg transition-colors disabled:opacity-50 ${
                            page.is_active
                              ? 'text-success hover:text-gray-500 hover:bg-gray-100'
                              : 'text-gray-400 hover:text-success hover:bg-success/10'
                          }`}
                          title={page.is_active ? 'Set to Draft' : 'Set to Live'}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(page)}
                          disabled={deletingId === page.id}
                          className="p-2 text-gray-400 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
