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
