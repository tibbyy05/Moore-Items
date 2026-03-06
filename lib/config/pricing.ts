export const PRICING_CONFIG = {
  markupMultiplier: 2.0,
  minimumMargin: 0.4,
  shippingCostEstimate: 3.0,
  stripeFeePercent: 0.029,
  stripeFeeFixed: 0.3,
  compareAtPriceMin: 1.3,
  compareAtPriceMax: 1.6,
  roundTo99: true,
};

// CN warehouse: higher shipping costs, slightly higher markup to cover longer delivery risk
export const CN_PRICING_CONFIG = {
  ...PRICING_CONFIG,
  markupMultiplier: 2.2,
  minimumMargin: 0.45,
  shippingCostEstimate: 5.0,
};

// Helper to get config by warehouse
export function getPricingConfig(warehouse: string = 'US') {
  return warehouse === 'CN' ? CN_PRICING_CONFIG : PRICING_CONFIG;
}

export async function getPricingConfigFromDB(supabase: any, warehouse: string = 'US'): Promise<typeof PRICING_CONFIG> {
  try {
    const { data } = await supabase.from('mi_settings').select('value').eq('key', 'pricing_config').single();
    if (!data?.value) return warehouse === 'CN' ? CN_PRICING_CONFIG : PRICING_CONFIG;
    const cfg = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
    const isCN = warehouse === 'CN';
    return {
      markupMultiplier: isCN ? (cfg.cn_markup ?? 1.8) : (cfg.us_markup ?? 1.6),
      minimumMargin: isCN ? (cfg.cn_min_margin ?? 0.20) : (cfg.us_min_margin ?? 0.15),
      shippingCostEstimate: isCN ? (cfg.cn_shipping_estimate ?? 5.00) : (cfg.us_shipping_estimate ?? 3.00),
      stripeFeePercent: cfg.stripe_fee_percent ?? 0.029,
      stripeFeeFixed: cfg.stripe_fee_fixed ?? 0.30,
      compareAtPriceMin: cfg.compare_at_min ?? 1.3,
      compareAtPriceMax: cfg.compare_at_max ?? 1.6,
      roundTo99: cfg.round_to_99 ?? true,
    };
  } catch {
    return warehouse === 'CN' ? CN_PRICING_CONFIG : PRICING_CONFIG;
  }
}

export async function getCategoryPricingRules(supabase: any): Promise<Record<string, {
  min_price: number | null;
  target_margin: number | null;
  markup_override: number | null;
}>> {
  try {
    const { data } = await supabase.from('mi_category_pricing').select('category_slug, min_price, target_margin, markup_override').eq('is_active', true);
    if (!data) return {};
    return Object.fromEntries(data.map((r: any) => [r.category_slug, r]));
  } catch {
    return {};
  }
}
