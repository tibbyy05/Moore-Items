'use client';

import { useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WeightTier {
  maxGrams: number | null;
  price: number;
  label: string;
}

interface ShippingConfig {
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  freeShippingWeightCapGrams: number;
  useCJFreightQuotes: boolean;
  freightMarkupPercent: number;
  minimumShippingCharge: number;
  weightTiers: WeightTier[];
  unknownWeightRate: number;
  flatRateShipping: number;
}

const formatMoney = (value: number) => `$${value.toFixed(2)}`;
const gramsToLbs = (grams: number) => (grams / 453.592).toFixed(1);

export default function ShippingPage() {
  const [config, setConfig] = useState<ShippingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [sampleWeight, setSampleWeight] = useState('3000');
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
    const weight = parseFloat(sampleWeight) || 0;

    if (config.freeShippingEnabled && subtotal >= config.freeShippingThreshold) {
      if (config.freeShippingWeightCapGrams > 0 && weight > config.freeShippingWeightCapGrams) {
        // Blocked by weight cap — fall through to tiers
      } else {
        return { cost: 0, method: 'Free Shipping', note: `Subtotal $${subtotal.toFixed(2)} meets $${config.freeShippingThreshold} threshold` };
      }
    }

    // Weight tier lookup
    if (weight > 0 && config.weightTiers.length > 0) {
      const sorted = [...config.weightTiers].sort((a, b) => {
        if (a.maxGrams === null) return 1;
        if (b.maxGrams === null) return -1;
        return a.maxGrams - b.maxGrams;
      });
      for (const tier of sorted) {
        if (tier.maxGrams === null || weight <= tier.maxGrams) {
          return {
            cost: tier.price,
            method: 'Weight Tier',
            note: `${weight}g (${gramsToLbs(weight)} lbs) → ${tier.label}`,
          };
        }
      }
    }

    if (weight === 0) {
      return { cost: config.unknownWeightRate, method: 'Unknown Weight', note: 'No weight data — using default rate' };
    }

    return { cost: config.flatRateShipping, method: 'Flat Rate', note: 'Last resort fallback' };
  }, [config, sampleWeight, sampleSubtotal]);

  const handleChange = (key: keyof ShippingConfig, value: string | boolean) => {
    setConfig((prev) =>
      prev
        ? { ...prev, [key]: typeof value === 'boolean' ? value : parseFloat(value) || 0 }
        : prev
    );
  };

  const updateTier = (index: number, field: keyof WeightTier, value: string) => {
    setConfig((prev) => {
      if (!prev) return prev;
      const tiers = [...prev.weightTiers];
      if (field === 'maxGrams') {
        tiers[index] = { ...tiers[index], maxGrams: value === '' ? null : Math.max(0, Number(value) || 0) };
      } else if (field === 'price') {
        tiers[index] = { ...tiers[index], price: Math.max(0, parseFloat(value) || 0) };
      } else {
        tiers[index] = { ...tiers[index], label: value };
      }
      return { ...prev, weightTiers: tiers };
    });
  };

  const addTier = () => {
    setConfig((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        weightTiers: [
          ...prev.weightTiers,
          { maxGrams: null, price: 0, label: 'New Tier' },
        ],
      };
    });
  };

  const removeTier = (index: number) => {
    setConfig((prev) => {
      if (!prev) return prev;
      return { ...prev, weightTiers: prev.weightTiers.filter((_, i) => i !== index) };
    });
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
        <p className="text-sm text-slate-500">Manage shipping rates, weight tiers, and free shipping rules.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weight Tiers — Primary */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Weight-Based Shipping Tiers</h2>
              <p className="text-xs text-slate-500 mt-0.5">Primary shipping calculation. For multi-item carts, the heaviest item determines the rate.</p>
            </div>
            <button
              onClick={addTier}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Tier
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase">Max Weight (g)</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase">Approx lbs</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase">Price ($)</th>
                  <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase">Label</th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {config.weightTiers.map((tier, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        step="100"
                        min="0"
                        placeholder="No limit"
                        value={tier.maxGrams === null ? '' : tier.maxGrams}
                        onChange={(e) => updateTier(i, 'maxGrams', e.target.value)}
                        className="w-28 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                      />
                    </td>
                    <td className="py-2 pr-4 text-xs text-slate-400">
                      {tier.maxGrams !== null ? `~${gramsToLbs(tier.maxGrams)} lbs` : 'Unlimited'}
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={tier.price}
                        onChange={(e) => updateTier(i, 'price', e.target.value)}
                        className="w-24 rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                      />
                    </td>
                    <td className="py-2 pr-4">
                      <input
                        type="text"
                        value={tier.label}
                        onChange={(e) => updateTier(i, 'label', e.target.value)}
                        className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm"
                      />
                    </td>
                    <td className="py-2">
                      <button
                        onClick={() => removeTier(i)}
                        className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                        title="Remove tier"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <label className="space-y-1 text-sm max-w-xs">
            <span className="text-slate-500">Unknown weight rate ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.unknownWeightRate}
              onChange={(e) => handleChange('unknownWeightRate', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
            <p className="text-xs text-slate-400">
              Used when a product has no weight data in CJ
            </p>
          </label>
        </div>

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

        {/* CJ Quotes + Fallback */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-sm font-semibold text-slate-900">CJ Real-Time Quotes</h2>
          <p className="text-xs text-slate-400">Optional. If CJ returns a valid quote (&gt; $0), it takes priority over weight tiers. Currently returns $0 for US warehouse items.</p>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={config.useCJFreightQuotes}
              onChange={(e) => handleChange('useCJFreightQuotes', e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-gold-500 focus:ring-gold-500"
            />
            <span className="text-sm text-slate-700">Enable CJ freight quotes</span>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Markup (%)</span>
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
            </label>
            <label className="space-y-1 text-sm">
              <span className="text-slate-500">Minimum ($)</span>
              <input
                type="number"
                step="0.01"
                min="0"
                value={config.minimumShippingCharge}
                onChange={(e) => handleChange('minimumShippingCharge', e.target.value)}
                disabled={!config.useCJFreightQuotes}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-50"
              />
            </label>
          </div>

          <hr className="border-slate-200" />

          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Fallback flat rate ($)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              value={config.flatRateShipping}
              onChange={(e) => handleChange('flatRateShipping', e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
            <p className="text-xs text-slate-400">
              Last resort when weight tiers and CJ both fail
            </p>
          </label>
        </div>
      </div>

      {/* Preview + Save */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <h2 className="text-sm font-semibold text-slate-900">Live Preview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <label className="space-y-1 text-sm">
            <span className="text-slate-500">Sample item weight (grams)</span>
            <input
              type="number"
              step="100"
              min="0"
              value={sampleWeight}
              onChange={(e) => setSampleWeight(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2"
            />
            <p className="text-xs text-slate-400">0 = unknown weight. {Number(sampleWeight) > 0 && `${gramsToLbs(Number(sampleWeight))} lbs`}</p>
          </label>
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
                <span className="text-slate-500">Shipping</span>
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
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 text-white px-6 py-2 text-sm font-semibold hover:bg-slate-800 disabled:opacity-60"
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
