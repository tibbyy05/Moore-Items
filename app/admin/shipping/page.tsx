'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShippingConfig {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  freeShippingWeightCapGrams: number;
  useCJFreightQuotes: boolean;
  freightMarkupPercent: number;
  flatRateShipping: number;
  minimumShippingCharge: number;
}

const formatMoney = (value: number) => `$${value.toFixed(2)}`;
const gramsToLbs = (grams: number) => (grams / 453.592).toFixed(1);

export default function ShippingPage() {
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [sampleSubtotal, setSampleSubtotal] = useState('45');

  useEffect(() => {
    fetch('/api/admin/shipping-config')
      .then((res) => res.json())
      .then((data) => setConfig(data))
      .catch(() => setMessage({ text: 'Failed to load shipping config', type: 'error' }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/shipping-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Save failed');
      setConfig(data);
      setMessage({ text: 'Shipping settings saved', type: 'success' });
    } catch (err: any) {
      setMessage({ text: err?.message || 'Failed to save', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const preview = useMemo(() => {
    if (!config) return null;
    const subtotal = parseFloat(sampleSubtotal) || 0;

    // Free shipping check
    if (config.freeShippingEnabled && subtotal >= config.freeShippingThreshold) {
      return { cost: 0, method: 'Free Shipping', note: 'Subtotal meets free shipping threshold' };
    }

    // CJ quote simulation
    if (config.useCJFreightQuotes) {
      const sampleCjQuote = 4.71; // Typical CJ USPS+ quote
      const withMarkup = Math.round(sampleCjQuote * (1 + config.freightMarkupPercent / 100) * 100) / 100;
      const final = Math.max(withMarkup, config.minimumShippingCharge);
      return {
        cost: final,
        method: 'CJ Real-Time Quote',
        note: `Example: CJ quotes $${sampleCjQuote.toFixed(2)} + ${config.freightMarkupPercent}% markup = ${formatMoney(withMarkup)}`,
      };
    }

    // Flat rate
    return { cost: config.flatRateShipping, method: 'Flat Rate', note: 'CJ quotes disabled' };
  }, [config, sampleSubtotal]);

  const handleChange = (key: keyof ShippingConfig, value: string | boolean) => {
    setConfig((prev) =>
      prev
        ? { ...prev, [key]: typeof value === 'boolean' ? value : parseFloat(value) || 0 }
        : prev
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12 text-slate-500">
        Failed to load shipping configuration. Make sure the mi_settings table exists.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Shipping Controls</h1>
        <p className="text-sm text-slate-500">Manage shipping rates, free shipping rules, and CJ freight quotes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Free Shipping */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Free Shipping</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.freeShippingEnabled}
              onChange={(e) => handleChange('freeShippingEnabled', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-slate-700">Enable free shipping</span>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Free shipping threshold ($)</span>
            <input
              type="number"
              step="1"
              min="0"
              value={config.freeShippingThreshold}
              onChange={(e) => handleChange('freeShippingThreshold', e.target.value)}
              disabled={!config.freeShippingEnabled}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Weight cap (grams)</span>
            <input
              type="number"
              step="100"
              min="0"
              value={config.freeShippingWeightCapGrams}
              onChange={(e) => handleChange('freeShippingWeightCapGrams', e.target.value)}
              disabled={!config.freeShippingEnabled}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
            />
            <p className="text-xs text-slate-400">
              Items over this weight won&apos;t qualify for free shipping.
              {config.freeShippingWeightCapGrams > 0 && (
                <> Currently: {gramsToLbs(config.freeShippingWeightCapGrams)} lbs</>
              )}
            </p>
          </label>
        </div>

        {/* CJ Real-Time Quotes */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">CJ Real-Time Quotes</h2>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useCJFreightQuotes}
              onChange={(e) => handleChange('useCJFreightQuotes', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-slate-700">Enable CJ freight quotes</span>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Markup on CJ quote (%)</span>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={config.freightMarkupPercent}
              onChange={(e) => handleChange('freightMarkupPercent', e.target.value)}
              disabled={!config.useCJFreightQuotes}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
            />
            <p className="text-xs text-slate-400">
              Buffer added on top of CJ&apos;s quoted price (e.g. 15 = CJ price &times; 1.15)
            </p>
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Minimum shipping charge ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.minimumShippingCharge}
              onChange={(e) => handleChange('minimumShippingCharge', e.target.value)}
              disabled={!config.useCJFreightQuotes}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
            />
            <p className="text-xs text-slate-400">
              Even with CJ quotes, never charge less than this
            </p>
          </label>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-500">
            <p className="font-medium text-slate-700 mb-1">How it works</p>
            <p>At checkout, the system queries CJ&apos;s freight API for a real-time USPS+ shipping quote based on the actual items in the cart. If the API fails, it falls back to the flat rate below.</p>
          </div>
        </div>

        {/* Fallback & Preview */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">Fallback Flat Rate</h2>

          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Flat rate shipping ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.flatRateShipping}
              onChange={(e) => handleChange('flatRateShipping', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
            <p className="text-xs text-slate-400">
              Used when CJ quotes are disabled or fail
            </p>
          </label>

          <hr className="border-slate-200" />

          <h2 className="text-sm font-semibold text-slate-900">Preview</h2>
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Sample cart subtotal ($)</span>
            <input
              type="number"
              step="1"
              value={sampleSubtotal}
              onChange={(e) => setSampleSubtotal(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
          </label>

          {preview && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Shipping Cost</span>
                <span className={cn('font-semibold', preview.cost === 0 ? 'text-green-600' : 'text-slate-900')}>
                  {preview.cost === 0 ? 'FREE' : formatMoney(preview.cost)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Method</span>
                <span className="font-medium text-slate-700">{preview.method}</span>
              </div>
              {preview.note && (
                <p className="text-xs text-slate-400 pt-1 border-t border-slate-200">{preview.note}</p>
              )}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white px-4 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Settings
          </button>

          {message && (
            <p className={cn('text-sm', message.type === 'success' ? 'text-green-600' : 'text-red-500')}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
