import { ShippingConfig, DEFAULT_SHIPPING_CONFIG } from '@/lib/config/shipping';
import { calculateCJFreight } from '@/lib/cj/freight';

export interface ShippingItem {
  quantity: number;
  unitPrice: number;
  isDigital: boolean;
  cjVid: string | null;
  productWeightGrams: number | null;
}

export interface ShippingResult {
  cost: number;
  method: 'free' | 'cj_quote' | 'flat_rate';
  label: string;
}

/**
 * Flat-rate fallback shipping calculation (sync, no external calls).
 * Used when CJ quotes are disabled, fail, or for non-CJ products.
 */
export function calculateFlatRateShipping(
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): number {
  if (config.freeShippingEnabled && subtotal >= config.freeShippingThreshold) {
    return 0;
  }
  return config.flatRateShipping;
}

/**
 * Full shipping calculation with CJ real-time quotes.
 * Falls back to flat rate if CJ call fails or is disabled.
 */
export async function calculateShippingCost(
  items: ShippingItem[],
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): Promise<ShippingResult> {
  const physicalItems = items.filter((item) => !item.isDigital);

  // All-digital cart — no shipping
  if (physicalItems.length === 0) {
    return { cost: 0, method: 'free', label: 'Digital Delivery' };
  }

  // Check free shipping eligibility
  if (config.freeShippingEnabled && subtotal >= config.freeShippingThreshold) {
    // Weight cap check: if any item exceeds weight cap, no free shipping
    const exceedsWeightCap = config.freeShippingWeightCapGrams > 0 && physicalItems.some(
      (item) =>
        item.productWeightGrams !== null &&
        item.productWeightGrams > config.freeShippingWeightCapGrams
    );

    if (!exceedsWeightCap) {
      return { cost: 0, method: 'free', label: 'Free Shipping' };
    }
  }

  // Try CJ real-time freight quote
  if (config.useCJFreightQuotes) {
    const cjItems = physicalItems
      .filter((item) => item.cjVid)
      .map((item) => ({ vid: item.cjVid!, quantity: item.quantity }));

    if (cjItems.length > 0) {
      const cjPrice = await calculateCJFreight(cjItems);

      if (cjPrice !== null) {
        const markupMultiplier = 1 + config.freightMarkupPercent / 100;
        let finalPrice = Math.round(cjPrice * markupMultiplier * 100) / 100;

        // Enforce minimum shipping charge
        if (config.minimumShippingCharge > 0) {
          finalPrice = Math.max(finalPrice, config.minimumShippingCharge);
        }

        return { cost: finalPrice, method: 'cj_quote', label: 'Standard Shipping' };
      }

      // CJ call failed — fall through to flat rate
      console.warn('[shipping] CJ freight quote failed, falling back to flat rate');
    }
  }

  // Fallback: flat rate
  return {
    cost: config.flatRateShipping,
    method: 'flat_rate',
    label: 'Standard Shipping',
  };
}
