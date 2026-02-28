'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Layers,
  Zap,
  MapPin,
  Plus,
  DollarSign,
  RefreshCw,
  Tag,
  Truck,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: any;
  count: number | null;
}

interface ComingSoonItem {
  label: string;
  icon: any;
  badge: string;
}

interface NavSection {
  heading: string;
  items: NavItem[];
  comingSoon?: ComingSoonItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'STORE',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, count: null },
      { href: '/admin/products', label: 'Products', icon: Package, count: null },
      { href: '/admin/products/add', label: 'Add Product', icon: Plus, count: null },
      { href: '/admin/pricing', label: 'Pricing', icon: DollarSign, count: null },
      { href: '/admin/shipping', label: 'Shipping', icon: Truck, count: null },
    ],
  },
  {
    heading: 'OPERATIONS',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, count: null },
      { href: '/admin/customers', label: 'Customers', icon: Users, count: null },
      { href: '/admin/promo-codes', label: 'Promo Codes', icon: Tag, count: null },
    ],
  },
  {
    heading: 'TOOLS',
    items: [
      { href: '/admin/us-stock', label: 'US Stock', icon: MapPin, count: null },
      { href: '/admin/catalog-health', label: 'Catalog Health', icon: Activity, count: null },
    ],
  },
  {
    heading: 'COMING SOON',
    items: [],
    comingSoon: [
      { label: 'Analytics', icon: BarChart3, badge: 'Beta' },
      { label: 'Landing Pages', icon: Layers, badge: 'Coming Soon' },
      { label: 'Ad Campaigns', icon: Zap, badge: 'Coming Soon' },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');
  const [lastSyncLabel, setLastSyncLabel] = useState('15m ago');
  const [productsCount, setProductsCount] = useState<number | null>(null);
  const [openOrdersCount, setOpenOrdersCount] = useState<number | null>(null);
  const [customersCount, setCustomersCount] = useState<number | null>(null);
  const [reviewSyncing, setReviewSyncing] = useState(false);
  const [reviewProgress, setReviewProgress] = useState({ done: 0, total: 0 });
  const [reviewMessage, setReviewMessage] = useState('');
  const [shippingSyncing, setShippingSyncing] = useState(false);
  const [shippingProgress, setShippingProgress] = useState({ done: 0, total: 0 });
  const [shippingMessage, setShippingMessage] = useState('');
  const [usSyncing, setUsSyncing] = useState(false);
  const [usSyncMessage, setUsSyncMessage] = useState('');
  const [usSyncError, setUsSyncError] = useState('');

  const navSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.map((item) => {
          if (item.href === '/admin/products') {
            return { ...item, count: productsCount };
          }
          if (item.href === '/admin/orders') {
            return { ...item, count: openOrdersCount };
          }
          if (item.href === '/admin/customers') {
            return { ...item, count: customersCount };
          }
          return item;
        }),
      })),
    [productsCount, openOrdersCount, customersCount]
  );

  const fetchCounts = async () => {
    try {
      const [productsRes, ordersRes] = await Promise.all([
        fetch('/api/admin/products?limit=1'),
        fetch('/api/admin/orders?limit=1'),
      ]);
  
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProductsCount(productsData.total ?? null);
      }
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOpenOrdersCount(ordersData.summary?.total ?? ordersData.total ?? null);
        setCustomersCount(ordersData.summary?.customers ?? null);
      }
    } catch {
      setProductsCount(null);
      setOpenOrdersCount(null);
      setCustomersCount(null);
    }
  };

  useEffect(() => {
    fetchCounts();
    const handleRefresh = () => fetchCounts();
    window.addEventListener('mi:counts:refresh', handleRefresh);
    return () => window.removeEventListener('mi:counts:refresh', handleRefresh);
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    setSyncError('');

    try {
      const response = await fetch('/api/admin/sync', { method: 'POST' });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Sync failed');
      }

      const syncedCount = data?.result?.synced ?? 0;
      setSyncMessage(`Synced ${syncedCount} products`);
      setLastSyncLabel('just now');
      window.dispatchEvent(new Event('mi:counts:refresh'));

      if (pathname === '/admin/products') {
        window.dispatchEvent(new Event('mi:products:refresh'));
      }
    } catch (error: any) {
      setSyncError(error?.message || 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResync = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    setSyncError('');

    try {
      const response = await fetch('/api/admin/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resync: true }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || 'Re-sync failed');
      }

      const syncedCount = data?.result?.synced ?? 0;
      setSyncMessage(`Re-synced ${syncedCount} products`);
      setLastSyncLabel('just now');
      window.dispatchEvent(new Event('mi:counts:refresh'));

      if (pathname === '/admin/products') {
        window.dispatchEvent(new Event('mi:products:refresh'));
      }
    } catch (error: any) {
      setSyncError(error?.message || 'Re-sync failed');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncUSProducts = async () => {
    const maxPages = 10;
    let totalNew = 0;
    setUsSyncing(true);
    setUsSyncMessage('');
    setUsSyncError('');

    try {
      for (let page = 1; page <= maxPages; page += 1) {
        setUsSyncMessage(
          `Syncing US products... Page ${page}/${maxPages} (${totalNew} new products found)`
        );
        const response = await fetch('/api/admin/sync-us-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ page, maxPages }),
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || 'Sync failed');
        }

        totalNew += data?.newProducts ?? 0;
        setUsSyncMessage(
          `Syncing US products... Page ${page}/${maxPages} (${totalNew} new products found)`
        );
      }

      setUsSyncMessage(`US product sync complete: ${totalNew} new products`);
      setLastSyncLabel('just now');
      window.dispatchEvent(new Event('mi:counts:refresh'));

      if (pathname === '/admin/products') {
        window.dispatchEvent(new Event('mi:products:refresh'));
      }
    } catch (error: any) {
      setUsSyncError(error?.message || 'Sync failed');
    } finally {
      setUsSyncing(false);
    }
  };

  const handleSyncReviews = async () => {
    setReviewSyncing(true);
    setReviewMessage('');
    try {
      const listRes = await fetch('/api/admin/sync-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'bulk' }),
      });
      const listData = await listRes.json();
      const products = listData.products || [];
      setReviewProgress({ done: 0, total: listData.total || products.length });

      for (let i = 0; i < products.length; i += 1) {
        const product = products[i];
        await fetch('/api/admin/sync-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, pid: product.pid }),
        });
        setReviewProgress({ done: i + 1, total: listData.total || products.length });
        if (i < products.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }

      setReviewMessage(
        `Synced reviews for ${listData.total || products.length} products`
      );
    } catch (error: any) {
      setReviewMessage(error?.message || 'Review sync failed');
    } finally {
      setReviewSyncing(false);
    }
  };

  const handleSyncShipping = async () => {
    setShippingSyncing(true);
    setShippingMessage('');
    try {
      const listRes = await fetch('/api/admin/sync-shipping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'bulk' }),
      });
      const listData = await listRes.json();
      const products = listData.products || [];
      setShippingProgress({ done: 0, total: listData.total || products.length });

      for (let i = 0; i < products.length; i += 1) {
        const product = products[i];
        await fetch('/api/admin/sync-shipping', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: product.id, pid: product.pid }),
        });
        setShippingProgress({ done: i + 1, total: listData.total || products.length });
        if (i < products.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1200));
        }
      }

      setShippingMessage(
        `Updated shipping for ${listData.total || products.length} products`
      );
    } catch (error: any) {
      setShippingMessage(error?.message || 'Shipping sync failed');
    } finally {
      setShippingSyncing(false);
    }
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      <div className="bg-white px-4 py-5 border-b border-gray-200">
        <Link href="/admin" className="block">
          <div className="flex items-center justify-center mb-1.5">
            <Image
              src="/TransparentLogo.png"
              alt="MooreItems"
              width={567}
              height={194}
              className="w-auto"
              style={{ height: '162px' }}
              priority
            />
          </div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#4a4740] text-center">
            Admin Panel
          </p>
        </Link>
      </div>

      <nav className="flex-1 p-4">
        {navSections.map((section, sectionIndex) => (
          <div key={section.heading} className={sectionIndex === 0 ? 'mt-0' : 'mt-6'}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              {section.heading}
            </p>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.href === '/admin' || item.href === '/admin/products'
                    ? pathname === item.href
                    : pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group',
                      isActive
                        ? 'bg-gold-500/10 text-gold-500'
                        : 'text-[#1a1a2e] hover:bg-gray-100'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-[18px] h-[18px] flex-shrink-0',
                        isActive ? 'text-gold-500' : 'text-gray-400 group-hover:text-gold-500'
                      )}
                      strokeWidth={2}
                    />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    {item.count !== null && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[11px] font-semibold rounded">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
              {section.comingSoon?.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-400 cursor-not-allowed"
                  >
                    <Icon
                      className="w-[18px] h-[18px] flex-shrink-0 text-gray-300"
                      strokeWidth={2}
                    />
                    <span className="flex-1 text-sm font-medium">{item.label}</span>
                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-medium rounded">
                      {item.badge}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs font-semibold text-[#1a1a2e]">CJ API Connected</span>
          </div>
          <p className="text-[11px] text-gray-500 mb-3">Last sync: {lastSyncLabel}</p>
          <div className="space-y-2">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="w-full px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
            <button
              onClick={handleResync}
              disabled={isSyncing}
              className="w-full px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-lg transition-colors border border-gray-200 disabled:opacity-60"
            >
              Re-sync All
            </button>
            <button
              onClick={handleSyncReviews}
              disabled={reviewSyncing}
              className="w-full px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-lg transition-colors border border-gray-200 disabled:opacity-60"
            >
              {reviewSyncing
                ? `Syncing reviews... ${reviewProgress.done}/${reviewProgress.total}`
                : 'Sync Reviews'}
            </button>
            <button
              onClick={handleSyncShipping}
              disabled={shippingSyncing}
              className="w-full px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-lg transition-colors border border-gray-200 disabled:opacity-60"
            >
              {shippingSyncing
                ? `Syncing shipping... ${shippingProgress.done}/${shippingProgress.total}`
                : 'Sync Shipping'}
            </button>
            <button
              onClick={handleSyncUSProducts}
              disabled={usSyncing}
              className="w-full px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-600 text-[11px] font-semibold rounded-lg transition-colors border border-gray-200 disabled:opacity-60"
            >
              {usSyncing ? 'Syncing US products...' : 'Sync US Products'}
            </button>
          </div>
          {(syncMessage || syncError) && (
            <p
              className={`mt-2 text-[11px] ${syncError ? 'text-danger' : 'text-success'}`}
            >
              {syncError || syncMessage}
            </p>
          )}
          {(reviewMessage || shippingMessage) && (
            <p className="mt-2 text-[11px] text-gray-500">
              {reviewMessage || shippingMessage}
            </p>
          )}
          {usSyncMessage && !usSyncError ? (
            <p className="mt-2 text-[11px] text-gray-500">{usSyncMessage}</p>
          ) : null}
          {usSyncError ? (
            <p className="mt-2 text-[11px] text-danger">{usSyncError}</p>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
