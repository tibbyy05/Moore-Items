'use client';

import { useRef, useState } from 'react';
import {
  CheckCircle,
  Loader2,
  MapPin,
  Package,
  XCircle,
  ArrowUpCircle,
} from 'lucide-react';

interface ProductToCheck {
  id: string;
  pid: string;
  name: string;
  currentWarehouse: string;
}

interface StockResult {
  pid: string;
  productId: string;
  name: string;
  hasUSStock: boolean;
  usQuantity: number;
  hasCNStock: boolean;
  cnQuantity: number;
  error?: string;
  updated?: boolean;
}

export default function USStockPage() {
  const [products, setProducts] = useState<ProductToCheck[]>([]);
  const [results, setResults] = useState<StockResult[]>([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const abortRef = useRef(false);

  const loadProducts = async () => {
    const res = await fetch('/api/admin/check-us-stock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'bulk' }),
    });
    const data = await res.json();
    setProducts(data.products || []);
    setTotal(data.total || 0);
    setLoaded(true);
    return data.products || [];
  };

  const startScan = async () => {
    const productsToScan = loaded ? products : await loadProducts();

    setScanning(true);
    setResults([]);
    setProgress(0);
    abortRef.current = false;

    for (let i = 0; i < productsToScan.length; i += 1) {
      if (abortRef.current) break;

      const product = productsToScan[i];
      try {
        const res = await fetch('/api/admin/check-us-stock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: 'single',
            pid: product.pid,
            productId: product.id,
          }),
        });
        const result = await res.json();

        setResults((prev) => [
          ...prev,
          {
            ...result,
            name: product.name,
          },
        ]);
      } catch (error) {
        setResults((prev) => [
          ...prev,
          {
            pid: product.pid,
            productId: product.id,
            name: product.name,
            hasUSStock: false,
            usQuantity: 0,
            hasCNStock: false,
            cnQuantity: 0,
            error: 'Request failed',
          },
        ]);
      }

      setProgress(i + 1);

      if (i < productsToScan.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
    }

    setScanning(false);
  };

  const stopScan = () => {
    abortRef.current = true;
  };

  const updateWarehouse = async (productId: string, resultIndex: number) => {
    const res = await fetch('/api/admin/check-us-stock', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        warehouse: 'US',
        shippingDays: '2-5 days',
      }),
    });

    if (res.ok) {
      setResults((prev) =>
        prev.map((result, index) => (index === resultIndex ? { ...result, updated: true } : result))
      );
    }
  };

  const updateAllUS = async () => {
    const usResults = results.filter((result) => result.hasUSStock && !result.updated);
    for (const result of usResults) {
      await updateWarehouse(result.productId, results.indexOf(result));
    }
  };

  const usResults = results.filter((result) => result.hasUSStock);
  const percentDone = total > 0 ? Math.round((progress / total) * 100) : 0;
  const remainingSeconds = Math.max(0, total - progress) * 1.2;
  const remainingMinutes = Math.max(1, Math.ceil(remainingSeconds / 60));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-playfair font-bold text-[#1a1a2e]">
            US Warehouse Stock Checker
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Scan your products to find US warehouse availability.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={startScan}
            disabled={scanning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gold-500 hover:bg-gold-600 text-[#1a1a2e] text-sm font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
            {scanning ? 'Scanning...' : 'Start Scan'}
          </button>
          {scanning && (
            <button
              onClick={stopScan}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Stop
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-500">Progress</p>
            <p className="text-lg font-semibold text-[#1a1a2e]">
              {progress}/{total} products checked
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {scanning ? `~${remainingMinutes} min remaining` : 'Ready to scan'}
          </div>
        </div>
        <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gold-500 transition-all"
            style={{ width: `${percentDone}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Found</p>
          <p className="text-sm font-semibold text-emerald-600">
            {usResults.length} products with US stock
          </p>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-[#1a1a2e]">US Stock Matches</h2>
          <button
            onClick={updateAllUS}
            disabled={usResults.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold disabled:opacity-60"
          >
            <ArrowUpCircle className="w-4 h-4" />
            Update All to US Warehouse
          </button>
        </div>

        {usResults.length === 0 ? (
          <div className="text-center py-10">
            <Package className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">
              Run a scan to find products with US warehouse availability.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {usResults.map((result, index) => (
              <div
                key={`${result.productId}-${result.pid}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-[#1a1a2e]">{result.name}</p>
                    <p className="text-xs text-gray-500">
                      US: {result.usQuantity} · CN: {result.cnQuantity || 0}
                    </p>
                  </div>
                </div>
                {result.updated ? (
                  <span className="text-xs font-semibold text-emerald-600">Updated ✓</span>
                ) : (
                  <button
                    onClick={() => updateWarehouse(result.productId, results.indexOf(result))}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-700 text-xs font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <MapPin className="w-4 h-4" />
                    Update to US Warehouse
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
