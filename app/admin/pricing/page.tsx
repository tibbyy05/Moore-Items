'use client';

import { useMemo, useState } from 'react';
import { PRICING_CONFIG } from '@/lib/config/pricing';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

type PricingConfig = typeof PRICING_CONFIG;

const formatMoney = (value: number) => `$${value.toFixed(2)}`;

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig>({ ...PRICING_CONFIG });
  const [sampleWholesale, setSampleWholesale] = useState('20');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const preview = useMemo(() => {
    const wholesale = parseFloat(sampleWholesale) || 0;
    const baseCost = wholesale + config.shippingCostEstimate;
    const rawRetail = baseCost * config.markupMultiplier;
    const retail = config.roundTo99 ? Math.ceil(rawRetail) - 0.01 : Math.round(rawRetail * 100) / 100;
    const stripeFee = retail * config.stripeFeePercent + config.stripeFeeFixed;
    const totalCost = baseCost + stripeFee;
    const margin = retail > 0 ? (retail - totalCost) / retail : 0;
    const compareAt =
      retail *
      (config.compareAtPriceMin + (config.compareAtPriceMax - config.compareAtPriceMin) / 2);

    return {
      wholesale,
      retail,
      compareAt: Math.round(compareAt * 100) / 100,
      marginPercent: Math.round(margin * 1000) / 10,
    };
  }, [config, sampleWholesale]);

  const handleConfigChange = (key: keyof PricingConfig, value: string | boolean) => {
    setConfig((prev) => ({
      ...prev,
      [key]: typeof value === 'boolean' ? value : parseFloat(value) || 0,
    }));
  };

  const handleReprice = async () => {
    setIsRunning(true);
    setResult(null);
    try {
      const res = await fetch('/api/admin/reprice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Request failed');
      }
      setResult(
        `Repriced ${data.updated} products (skipped ${data.skipped}, processed ${data.processed}).`
      );
    } catch (error: any) {
      setResult(error?.message || 'Failed to reprice products.');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Pricing Controls</h1>
        <p className="text-sm text-slate-500">Manage pricing logic and reprice the catalog.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Current Config</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="text-slate-500">Markup</div>
            <div className="text-slate-900">{config.markupMultiplier.toFixed(2)}x</div>
            <div className="text-slate-500">Min Margin</div>
            <div className="text-slate-900">{Math.round(config.minimumMargin * 100)}%</div>
            <div className="text-slate-500">Shipping Est.</div>
            <div className="text-slate-900">{formatMoney(config.shippingCostEstimate)}</div>
            <div className="text-slate-500">Stripe %</div>
            <div className="text-slate-900">{(config.stripeFeePercent * 100).toFixed(2)}%</div>
            <div className="text-slate-500">Stripe Fixed</div>
            <div className="text-slate-900">{formatMoney(config.stripeFeeFixed)}</div>
            <div className="text-slate-500">Compare At</div>
            <div className="text-slate-900">
              {config.compareAtPriceMin.toFixed(1)}x - {config.compareAtPriceMax.toFixed(1)}x
            </div>
            <div className="text-slate-500">Round .99</div>
            <div className="text-slate-900">{config.roundTo99 ? 'Yes' : 'No'}</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Adjust Settings</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <label className="space-y-1">
              <span className="text-slate-500">Markup Multiplier</span>
              <input
                type="number"
                step="0.01"
                value={config.markupMultiplier}
                onChange={(e) => handleConfigChange('markupMultiplier', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">Minimum Margin</span>
              <input
                type="number"
                step="0.01"
                value={config.minimumMargin}
                onChange={(e) => handleConfigChange('minimumMargin', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">Shipping Estimate</span>
              <input
                type="number"
                step="0.01"
                value={config.shippingCostEstimate}
                onChange={(e) => handleConfigChange('shippingCostEstimate', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">Compare At Min</span>
              <input
                type="number"
                step="0.1"
                value={config.compareAtPriceMin}
                onChange={(e) => handleConfigChange('compareAtPriceMin', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">Compare At Max</span>
              <input
                type="number"
                step="0.1"
                value={config.compareAtPriceMax}
                onChange={(e) => handleConfigChange('compareAtPriceMax', e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              />
            </label>
            <label className="space-y-1">
              <span className="text-slate-500">Round to .99</span>
              <select
                value={config.roundTo99 ? 'yes' : 'no'}
                onChange={(e) => handleConfigChange('roundTo99', e.target.value === 'yes')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2"
              >
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Live Preview</h2>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Sample Wholesale Price</span>
            <input
              type="number"
              step="0.01"
              value={sampleWholesale}
              onChange={(e) => setSampleWholesale(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Retail Price</span>
              <span className="font-semibold text-slate-900">{formatMoney(preview.retail)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Compare At</span>
              <span className="font-semibold text-slate-900">{formatMoney(preview.compareAt)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Margin</span>
              <span
                className={cn(
                  'font-semibold',
                  preview.marginPercent >= config.minimumMargin * 100
                    ? 'text-green-600'
                    : 'text-red-500'
                )}
              >
                {preview.marginPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <button
            onClick={handleReprice}
            disabled={isRunning}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
          >
            {isRunning && <Loader2 className="w-4 h-4 animate-spin" />}
            Reprice All Products
          </button>
          {result && <p className="text-sm text-slate-600">{result}</p>}
        </div>
      </div>
    </div>
  );
}
