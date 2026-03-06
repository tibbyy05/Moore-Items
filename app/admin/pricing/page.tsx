'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface GlobalConfig {
  us_markup: number;
  cn_markup: number;
  us_min_margin: number;
  cn_min_margin: number;
  us_shipping_estimate: number;
  cn_shipping_estimate: number;
  stripe_fee_percent: number;
  stripe_fee_fixed: number;
  compare_at_min: number;
  compare_at_max: number;
  round_to_99: boolean;
}

interface CategoryRule {
  id?: string;
  category_slug: string;
  category_name: string;
  min_price: number | null;
  target_margin: number | null;
  markup_override: number | null;
  is_active?: boolean;
}

const DEFAULT_CONFIG: GlobalConfig = {
  us_markup: 1.6,
  cn_markup: 1.8,
  us_min_margin: 0.15,
  cn_min_margin: 0.20,
  us_shipping_estimate: 3.00,
  cn_shipping_estimate: 5.00,
  stripe_fee_percent: 0.029,
  stripe_fee_fixed: 0.30,
  compare_at_min: 1.3,
  compare_at_max: 1.6,
  round_to_99: true,
};

export default function PricingPage() {
  const [config, setConfig] = useState<GlobalConfig>(DEFAULT_CONFIG);
  const [categories, setCategories] = useState<CategoryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingCategories, setSavingCategories] = useState(false);
  const [globalMsg, setGlobalMsg] = useState<string | null>(null);
  const [categoryMsg, setCategoryMsg] = useState<string | null>(null);
  const [sampleWholesale, setSampleWholesale] = useState('20');
  const [repricing, setRepricing] = useState(false);
  const [repriceMsg, setRepriceMsg] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/pricing-config').then((r) => r.json()),
      fetch('/api/admin/category-pricing').then((r) => r.json()),
    ])
      .then(([cfg, cats]) => {
        setConfig({ ...DEFAULT_CONFIG, ...cfg });
        if (Array.isArray(cats)) setCategories(cats);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = (key: keyof GlobalConfig, raw: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [key]: typeof raw === 'boolean' ? raw : parseFloat(raw) || 0,
    }));
  };

  const updateCategory = (index: number, key: keyof CategoryRule, raw: string) => {
    setCategories((prev) => {
      const next = [...prev];
      const val = raw === '' ? null : parseFloat(raw);
      next[index] = { ...next[index], [key]: val };
      return next;
    });
  };

  const saveGlobal = async () => {
    setSavingGlobal(true);
    setGlobalMsg(null);
    try {
      const res = await fetch('/api/admin/pricing-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Save failed');
      setGlobalMsg('Global settings saved.');
    } catch (e: any) {
      setGlobalMsg(e?.message || 'Failed to save.');
    } finally {
      setSavingGlobal(false);
    }
  };

  const saveCategories = async () => {
    setSavingCategories(true);
    setCategoryMsg(null);
    try {
      const payload = categories.map((c) => ({
        category_slug: c.category_slug,
        category_name: c.category_name,
        min_price: c.min_price,
        target_margin: c.target_margin,
        markup_override: c.markup_override,
      }));
      const res = await fetch('/api/admin/category-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setCategoryMsg(`Category rules saved (${data.updated} updated).`);
    } catch (e: any) {
      setCategoryMsg(e?.message || 'Failed to save.');
    } finally {
      setSavingCategories(false);
    }
  };

  const preview = useMemo(() => {
    const wholesale = parseFloat(sampleWholesale) || 0;
    const baseCost = wholesale + config.us_shipping_estimate;
    let retail = baseCost * config.us_markup;
    retail = config.round_to_99 ? Math.ceil(retail) - 0.01 : Math.round(retail * 100) / 100;
    const stripeFee = retail * 0.029 + 0.30;
    const margin = retail > 0 ? ((retail - baseCost - stripeFee) / retail) * 100 : 0;
    const compareAt = Math.round(retail * config.compare_at_min * 100) / 100;
    return {
      retail: Math.round(retail * 100) / 100,
      compareAt,
      margin: Math.round(margin * 10) / 10,
    };
  }, [config, sampleWholesale]);

  const handleReprice = async () => {
    const confirmed = window.confirm(
      'This will reprice all active products using your saved settings. Category minimum prices and target margins will be applied. This cannot be undone.'
    );
    if (!confirmed) return;

    setRepricing(true);
    setRepriceMsg(null);
    try {
      const res = await fetch('/api/admin/reprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            markupMultiplier: config.us_markup,
            minimumMargin: config.us_min_margin,
            shippingCostEstimate: config.us_shipping_estimate,
            stripeFeePercent: 0.029,
            stripeFeeFixed: 0.30,
            compareAtPriceMin: config.compare_at_min,
            compareAtPriceMax: config.compare_at_max,
            roundTo99: config.round_to_99,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Reprice failed');
      setRepriceMsg(
        `Repriced ${data.updated} products (skipped ${data.skipped}, processed ${data.processed}).`
      );
    } catch (e: any) {
      setRepriceMsg(e?.message || 'Failed to reprice products.');
    } finally {
      setRepricing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pricing Controls</h1>
        <p className="text-sm text-slate-500">Manage global pricing and per-category rules.</p>
      </div>

      {/* SECTION 1 — Global Settings */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Global Settings
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* US Warehouse */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">US Warehouse</h3>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-500">Price Multiplier</span>
              <input
                type="number"
                step="0.1"
                min="1.0"
                value={config.us_markup}
                onChange={(e) => updateConfig('us_markup', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <span className="text-xs text-slate-400">
                How much to charge above your total cost. 1.6x on a $10 cost = $16 retail.
              </span>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-500">Minimum Margin %</span>
              <input
                type="number"
                step="1"
                min="0"
                value={Math.round(config.us_min_margin * 100)}
                onChange={(e) =>
                  updateConfig('us_min_margin', String((parseFloat(e.target.value) || 0) / 100))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <span className="text-xs text-slate-400">
                Products below this margin are skipped during reprice.
              </span>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-500">Shipping Estimate $</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={config.us_shipping_estimate}
                onChange={(e) => updateConfig('us_shipping_estimate', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <span className="text-xs text-slate-400">
                Added to wholesale cost before calculating retail price.
              </span>
            </label>
          </div>

          {/* China Warehouse */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">China Warehouse</h3>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-500">Price Multiplier</span>
              <input
                type="number"
                step="0.1"
                min="1.0"
                value={config.cn_markup}
                onChange={(e) => updateConfig('cn_markup', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <span className="text-xs text-slate-400">
                How much to charge above your total cost. 1.6x on a $10 cost = $16 retail.
              </span>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-500">Minimum Margin %</span>
              <input
                type="number"
                step="1"
                min="0"
                value={Math.round(config.cn_min_margin * 100)}
                onChange={(e) =>
                  updateConfig('cn_min_margin', String((parseFloat(e.target.value) || 0) / 100))
                }
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <span className="text-xs text-slate-400">
                Products below this margin are skipped during reprice.
              </span>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-500">Shipping Estimate $</span>
              <input
                type="number"
                step="0.50"
                min="0"
                value={config.cn_shipping_estimate}
                onChange={(e) => updateConfig('cn_shipping_estimate', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
              <span className="text-xs text-slate-400">
                Added to wholesale cost before calculating retail price.
              </span>
            </label>
          </div>
        </div>

        {/* Shared settings */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
            <div className="space-y-1">
              <span className="text-slate-500">Compare-At Range</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  value={config.compare_at_min}
                  onChange={(e) => updateConfig('compare_at_min', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
                <span className="text-slate-400">to</span>
                <input
                  type="number"
                  step="0.1"
                  min="1.0"
                  value={config.compare_at_max}
                  onChange={(e) => updateConfig('compare_at_max', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2"
                />
              </div>
              <span className="text-xs text-slate-400">
                Multiplier range for the crossed-out &ldquo;was&rdquo; price.
              </span>
            </div>
            <label className="flex items-center gap-3 self-center">
              <input
                type="checkbox"
                checked={config.round_to_99}
                onChange={(e) => updateConfig('round_to_99', e.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span className="text-slate-700 text-sm">Round prices to .99</span>
            </label>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveGlobal}
            disabled={savingGlobal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0f1629] text-white px-5 py-2 text-sm font-semibold hover:bg-[#1a2240] disabled:opacity-60"
          >
            {savingGlobal && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Global Settings
          </button>
          {globalMsg && <span className="text-sm text-green-600">{globalMsg}</span>}
        </div>
      </div>

      {/* SECTION 2 — Category Minimum Prices */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Category Minimum Prices
        </h2>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Min Price ($)
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Target Margin (%)
                </th>
                <th className="text-left py-3 px-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  Markup Override
                </th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat, i) => (
                <tr
                  key={cat.category_slug}
                  className="border-b border-gray-200 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3 px-4 text-slate-900 font-medium">{cat.category_name}</td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={cat.min_price ?? ''}
                      onChange={(e) => updateCategory(i, 'min_price', e.target.value)}
                      className="w-24 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="0"
                      value={cat.target_margin != null ? Math.round(cat.target_margin * 100) : ''}
                      onChange={(e) =>
                        updateCategory(
                          i,
                          'target_margin',
                          e.target.value === '' ? '' : String((parseFloat(e.target.value) || 0) / 100)
                        )
                      }
                      className="w-20 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />
                  </td>
                  <td className="py-3 px-4">
                    <input
                      type="number"
                      step="0.1"
                      min="1.0"
                      placeholder="Use global"
                      value={cat.markup_override ?? ''}
                      onChange={(e) => updateCategory(i, 'markup_override', e.target.value)}
                      className="w-28 rounded-lg border border-slate-200 px-3 py-1.5 text-sm"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveCategories}
            disabled={savingCategories}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0f1629] text-white px-5 py-2 text-sm font-semibold hover:bg-[#1a2240] disabled:opacity-60"
          >
            {savingCategories && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Category Rules
          </button>
          {categoryMsg && <span className="text-sm text-green-600">{categoryMsg}</span>}
        </div>
      </div>

      {/* SECTION 3 — Live Preview + Reprice */}
      <div className="space-y-4">
        <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wider">
          Preview &amp; Reprice
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* LEFT — Live Preview */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900">Live Preview</h3>
            <label className="block space-y-1 text-sm">
              <span className="text-slate-500">Sample Wholesale Price $</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sampleWholesale}
                onChange={(e) => setSampleWholesale(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Retail Price</span>
                <span className="font-semibold text-slate-900">${preview.retail.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Compare-At Price</span>
                <span className="font-semibold text-slate-900">${preview.compareAt.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Margin</span>
                <span
                  className={`font-semibold ${
                    preview.margin >= config.us_min_margin * 100
                      ? 'text-green-600'
                      : 'text-red-500'
                  }`}
                >
                  {preview.margin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT — Reprice */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Reprice Catalog</h3>
              <p className="text-sm text-slate-500 mt-1">
                Apply your saved global settings and category rules to all active products.
              </p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleReprice}
                disabled={repricing}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-[#0f1629] text-white px-5 py-2.5 text-sm font-semibold hover:bg-[#1a2240] disabled:opacity-60"
              >
                {repricing && <Loader2 className="w-4 h-4 animate-spin" />}
                Reprice All Products
              </button>
              {repriceMsg && <p className="text-sm text-green-600">{repriceMsg}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
