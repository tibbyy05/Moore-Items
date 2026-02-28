import { cjClient } from '@/lib/cj/client';

/**
 * Calculate freight cost from CJ Dropshipping for a set of items.
 * Calls CJ's freight API and filters for the USPS+ logistics method.
 * Returns the quoted price in USD, or null on any error (so caller can fallback).
 */
export async function calculateCJFreight(
  items: { vid: string; quantity: number }[]
): Promise<number | null> {
  if (items.length === 0) return null;

  try {
    console.log('[cj freight] Requesting freight for:', JSON.stringify(items));

    const results = await cjClient.calculateFreight({
      startCountryCode: 'US',
      endCountryCode: 'US',
      products: items,
    });

    console.log('[cj freight] Full API response:', JSON.stringify(results, null, 2));

    if (!Array.isArray(results) || results.length === 0) {
      console.warn('[cj freight] No logistics options returned');
      return null;
    }

    console.log('[cj freight] Available options:');
    for (const r of results) {
      console.log(`[cj freight]   ${r.logisticName}: $${r.logisticPrice} (${r.logisticAging} days)`);
    }

    // Filter out $0 quotes — CJ returns $0 for US warehouse items where
    // shipping is baked into product cost. These aren't real quotes.
    const validResults = results.filter((r) => r.logisticPrice > 0);

    if (validResults.length === 0) {
      console.warn('[cj freight] All quotes are $0 (shipping included in product cost) — treating as no valid quote');
      return null;
    }

    console.log('[cj freight] Valid (non-zero) options:');
    for (const r of validResults) {
      console.log(`[cj freight]   ${r.logisticName}: $${r.logisticPrice} (${r.logisticAging} days)`);
    }

    // Find USPS+ (the logistics method used for fulfillment)
    const uspsPlus = validResults.find(
      (r) => r.logisticName === 'USPS+' || r.logisticName === 'USPS Plus'
    );

    if (uspsPlus) {
      console.log(
        `[cj freight] ✓ Selected USPS+: $${uspsPlus.logisticPrice} (${uspsPlus.logisticAging} days)`
      );
      return uspsPlus.logisticPrice;
    }

    // If USPS+ not available, use the cheapest valid option as fallback
    const sorted = [...validResults].sort((a, b) => a.logisticPrice - b.logisticPrice);
    console.log(
      `[cj freight] ✗ USPS+ not found, using cheapest: ${sorted[0].logisticName} $${sorted[0].logisticPrice}`
    );
    return sorted[0].logisticPrice;
  } catch (error) {
    console.error('[cj freight] API call failed:', error);
    return null;
  }
}
