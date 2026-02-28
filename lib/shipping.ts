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
  method: 'free' | 'cj_quote' | 'weight_tier' | 'unknown_weight' | 'flat_rate';
  label: string;
}

/**
 * Flat-rate fallback shipping calculation (sync, no external calls).
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
 * Get the shipping cost for a given weight using the weight tier table.
 * Returns the tier price, or null if no tiers are configured.
 */
function getWeightTierPrice(
  weightGrams: number,
  config: ShippingConfig
): { price: number; tierLabel: string } | null {
  if (!config.weightTiers || config.weightTiers.length === 0) return null;

  // Tiers should be sorted by maxGrams ascending, with null (unlimited) last
  const sorted = [...config.weightTiers].sort((a, b) => {
    if (a.maxGrams === null) return 1;
    if (b.maxGrams === null) return -1;
    return a.maxGrams - b.maxGrams;
  });

  for (const tier of sorted) {
    if (tier.maxGrams === null || weightGrams <= tier.maxGrams) {
      return { price: tier.price, tierLabel: tier.label };
    }
  }

  // Shouldn't reach here if last tier has maxGrams: null, but fallback to last tier
  const last = sorted[sorted.length - 1];
  return { price: last.price, tierLabel: last.label };
}

/**
 * Full shipping calculation with weight tiers and CJ quote support.
 *
 * Priority:
 * 1. Digital items → $0
 * 2. Free shipping (threshold + weight cap check)
 * 3. CJ freight quote (if enabled and returns > $0)
 * 4. Weight-based tiers (heaviest item determines rate)
 * 5. Unknown weight default rate
 * 6. Flat rate fallback
 */
export async function calculateShippingCost(
  items: ShippingItem[],
  subtotal: number,
  config: ShippingConfig = DEFAULT_SHIPPING_CONFIG
): Promise<ShippingResult> {
  const physicalItems = items.filter((item) => !item.isDigital);

  console.log('[shipping] ── Shipping Calculation ──');
  console.log('[shipping] Items:', physicalItems.length, 'physical,', items.length - physicalItems.length, 'digital');
  console.log('[shipping] Subtotal:', `$${subtotal.toFixed(2)}`);

  // All-digital cart — no shipping
  if (physicalItems.length === 0) {
    console.log('[shipping] → RESULT: Digital Delivery ($0)');
    return { cost: 0, method: 'free', label: 'Digital Delivery' };
  }

  // Log each item's weight and CJ vid
  for (const item of physicalItems) {
    console.log(`[shipping]   Item: qty=${item.quantity}, price=$${item.unitPrice.toFixed(2)}, cjVid=${item.cjVid || 'NONE'}, weight=${item.productWeightGrams !== null ? item.productWeightGrams + 'g' : 'NULL'}`);
  }

  // Check free shipping eligibility
  if (config.freeShippingEnabled && subtotal >= config.freeShippingThreshold) {
    console.log(`[shipping] Free shipping eligible: subtotal $${subtotal.toFixed(2)} >= threshold $${config.freeShippingThreshold}`);

    const heavyItem = config.freeShippingWeightCapGrams > 0
      ? physicalItems.find(
          (item) =>
            item.productWeightGrams !== null &&
            item.productWeightGrams > config.freeShippingWeightCapGrams
        )
      : undefined;

    if (heavyItem) {
      console.log(`[shipping] ✗ Free shipping BLOCKED by weight cap: item weighs ${heavyItem.productWeightGrams}g > cap ${config.freeShippingWeightCapGrams}g`);
    } else {
      const itemsWithNullWeight = physicalItems.filter((item) => item.productWeightGrams === null);
      if (itemsWithNullWeight.length > 0) {
        console.log(`[shipping] ⚠ ${itemsWithNullWeight.length} item(s) have NULL weight — weight cap cannot be enforced for these`);
      }
      console.log('[shipping] → RESULT: Free Shipping ($0)');
      return { cost: 0, method: 'free', label: 'Free Shipping' };
    }
  } else if (config.freeShippingEnabled) {
    console.log(`[shipping] Free shipping not eligible: subtotal $${subtotal.toFixed(2)} < threshold $${config.freeShippingThreshold}`);
  } else {
    console.log('[shipping] Free shipping disabled');
  }

  // Try CJ real-time freight quote (kept as future option)
  if (config.useCJFreightQuotes) {
    const cjItems = physicalItems
      .filter((item) => item.cjVid)
      .map((item) => ({ vid: item.cjVid!, quantity: item.quantity }));

    console.log(`[shipping] CJ freight: ${cjItems.length} items with CJ variant IDs`);

    if (cjItems.length > 0) {
      console.log('[shipping] CJ freight request:', JSON.stringify(cjItems));
      const cjPrice = await calculateCJFreight(cjItems);

      if (cjPrice !== null && cjPrice > 0) {
        const markupMultiplier = 1 + config.freightMarkupPercent / 100;
        const withMarkup = Math.round(cjPrice * markupMultiplier * 100) / 100;
        const finalPrice = Math.max(withMarkup, config.minimumShippingCharge);

        console.log(`[shipping] CJ raw quote: $${cjPrice.toFixed(2)}`);
        console.log(`[shipping] After ${config.freightMarkupPercent}% markup: $${withMarkup.toFixed(2)}`);
        console.log(`[shipping] After minimum ($${config.minimumShippingCharge}) enforcement: $${finalPrice.toFixed(2)}`);
        console.log(`[shipping] → RESULT: CJ Quote ($${finalPrice.toFixed(2)})`);

        return { cost: finalPrice, method: 'cj_quote', label: 'Standard Shipping' };
      }

      console.log('[shipping] CJ returned $0 or null — falling through to weight tiers');
    } else {
      console.log('[shipping] No items with CJ variant IDs — skipping CJ freight');
    }
  } else {
    console.log('[shipping] CJ freight quotes disabled');
  }

  // Weight-based tier calculation — use the heaviest item's tier
  const itemsWithWeight = physicalItems.filter((item) => item.productWeightGrams !== null);
  const itemsWithoutWeight = physicalItems.filter((item) => item.productWeightGrams === null);

  if (itemsWithWeight.length > 0) {
    const heaviestWeight = Math.max(...itemsWithWeight.map((item) => item.productWeightGrams!));
    const tier = getWeightTierPrice(heaviestWeight, config);

    if (tier) {
      console.log(`[shipping] Heaviest item: ${heaviestWeight}g → tier "${tier.tierLabel}" = $${tier.price.toFixed(2)}`);

      // If there are also items without weight, use the higher of tier price and unknown rate
      if (itemsWithoutWeight.length > 0) {
        const finalPrice = Math.max(tier.price, config.unknownWeightRate);
        console.log(`[shipping] ⚠ ${itemsWithoutWeight.length} item(s) have unknown weight, using max(tier $${tier.price.toFixed(2)}, unknown rate $${config.unknownWeightRate.toFixed(2)}) = $${finalPrice.toFixed(2)}`);
        console.log(`[shipping] → RESULT: Weight Tier ($${finalPrice.toFixed(2)})`);
        return { cost: finalPrice, method: 'weight_tier', label: 'Standard Shipping' };
      }

      console.log(`[shipping] → RESULT: Weight Tier ($${tier.price.toFixed(2)})`);
      return { cost: tier.price, method: 'weight_tier', label: 'Standard Shipping' };
    }
  }

  // All items have unknown weight — use unknown weight rate
  if (itemsWithoutWeight.length > 0 && config.unknownWeightRate > 0) {
    console.log(`[shipping] All items have unknown weight → using unknown weight rate: $${config.unknownWeightRate.toFixed(2)}`);
    console.log(`[shipping] → RESULT: Unknown Weight Rate ($${config.unknownWeightRate.toFixed(2)})`);
    return { cost: config.unknownWeightRate, method: 'unknown_weight', label: 'Standard Shipping' };
  }

  // Last resort: flat rate
  console.log(`[shipping] → RESULT: Flat Rate ($${config.flatRateShipping.toFixed(2)})`);
  return {
    cost: config.flatRateShipping,
    method: 'flat_rate',
    label: 'Standard Shipping',
  };
}
