import { PRICING_CONFIG } from './config/pricing';

const STRIPE_PERCENT_FEE = PRICING_CONFIG.stripeFeePercent;
const STRIPE_FIXED_FEE = PRICING_CONFIG.stripeFeeFixed;
const MIN_MARGIN_PERCENT = PRICING_CONFIG.minimumMargin * 100;
const DEFAULT_MARKUP = PRICING_CONFIG.markupMultiplier;
const DEFAULT_SHIPPING_COST = PRICING_CONFIG.shippingCostEstimate;

export interface PricingResult {
  cjPrice: number;
  shippingCost: number;
  stripeFee: number;
  totalCost: number;
  retailPrice: number;
  compareAtPrice: number | null;
  marginDollars: number;
  marginPercent: number;
  isViable: boolean;
}

export function calculatePricing(
  cjPrice: number,
  shippingCost: number = DEFAULT_SHIPPING_COST,
  markupMultiplier: number = DEFAULT_MARKUP,
  compareAtPrice?: number | null
): PricingResult {
  return calculatePricingWithConfig(
    cjPrice,
    shippingCost,
    {
      markupMultiplier: DEFAULT_MARKUP,
      minimumMargin: PRICING_CONFIG.minimumMargin,
      shippingCostEstimate: DEFAULT_SHIPPING_COST,
      stripeFeePercent: STRIPE_PERCENT_FEE,
      stripeFeeFixed: STRIPE_FIXED_FEE,
      compareAtPriceMin: PRICING_CONFIG.compareAtPriceMin,
      compareAtPriceMax: PRICING_CONFIG.compareAtPriceMax,
      roundTo99: PRICING_CONFIG.roundTo99,
    },
    markupMultiplier,
    compareAtPrice
  );
}

export function calculatePricingWithConfig(
  cjPrice: number,
  shippingCost: number,
  config: typeof PRICING_CONFIG,
  markupMultiplier: number = config.markupMultiplier,
  compareAtPrice?: number | null
): PricingResult {
  cjPrice = parseFloat(String(cjPrice)) || 0;
  shippingCost = parseFloat(String(shippingCost)) || 0;
  markupMultiplier = parseFloat(String(markupMultiplier)) || config.markupMultiplier;

  if (
    !Number.isFinite(cjPrice) ||
    !Number.isFinite(shippingCost) ||
    !Number.isFinite(markupMultiplier)
  ) {
    return {
      cjPrice: 0,
      shippingCost: 0,
      stripeFee: 0,
      totalCost: 0,
      retailPrice: 0,
      compareAtPrice: compareAtPrice || null,
      marginDollars: 0,
      marginPercent: 0,
      isViable: false,
    };
  }

  const baseCost = cjPrice + shippingCost;

  let retailPrice = baseCost * markupMultiplier;
  retailPrice = config.roundTo99
    ? Math.ceil(retailPrice) - 0.01
    : Math.round(retailPrice * 100) / 100;

  const stripeFee = retailPrice * config.stripeFeePercent + config.stripeFeeFixed;
  const totalCost = baseCost + stripeFee;
  const marginDollars = retailPrice - totalCost;
  const marginPercent = retailPrice > 0 ? (marginDollars / retailPrice) * 100 : 0;

  return {
    cjPrice,
    shippingCost,
    stripeFee: Math.round(stripeFee * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    retailPrice: Math.round(retailPrice * 100) / 100,
    compareAtPrice: compareAtPrice || null,
    marginDollars: Math.round(marginDollars * 100) / 100,
    marginPercent: Math.round(marginPercent * 10) / 10,
    isViable: marginPercent >= config.minimumMargin * 100,
  };
}

export function priceForMargin(
  cjPrice: number,
  shippingCost: number = DEFAULT_SHIPPING_COST,
  targetMarginPercent: number
): number {
  const baseCost = cjPrice + shippingCost;
  const retailPrice =
    (baseCost + STRIPE_FIXED_FEE) /
    (1 - STRIPE_PERCENT_FEE - targetMarginPercent / 100);
  return PRICING_CONFIG.roundTo99
    ? Math.ceil(retailPrice) - 0.01
    : Math.round(retailPrice * 100) / 100;
}

export function shouldAutoHide(marginPercent: number): boolean {
  return marginPercent < MIN_MARGIN_PERCENT;
}

export function computeCompareAtPrice(retailPrice: number): number {
  const multiplier =
    PRICING_CONFIG.compareAtPriceMin +
    Math.random() * (PRICING_CONFIG.compareAtPriceMax - PRICING_CONFIG.compareAtPriceMin);
  return Math.round(retailPrice * multiplier * 100) / 100;
}

export function computeCompareAtPriceWithConfig(
  retailPrice: number,
  config: typeof PRICING_CONFIG
): number {
  const multiplier =
    config.compareAtPriceMin +
    Math.random() * (config.compareAtPriceMax - config.compareAtPriceMin);
  return Math.round(retailPrice * multiplier * 100) / 100;
}
