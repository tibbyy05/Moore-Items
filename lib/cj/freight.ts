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
    const results = await cjClient.calculateFreight({
      startCountryCode: 'US',
      endCountryCode: 'US',
      products: items,
    });

    if (!Array.isArray(results) || results.length === 0) {
      console.warn('[cj freight] No logistics options returned');
      return null;
    }

    // Find USPS+ (the logistics method used for fulfillment)
    const uspsPlus = results.find(
      (r) => r.logisticName === 'USPS+' || r.logisticName === 'USPS Plus'
    );

    if (uspsPlus) {
      console.log(
        `[cj freight] USPS+ quote: $${uspsPlus.logisticPrice} (${uspsPlus.logisticAging} days)`
      );
      return uspsPlus.logisticPrice;
    }

    // If USPS+ not available, use the cheapest option as fallback
    const sorted = [...results].sort((a, b) => a.logisticPrice - b.logisticPrice);
    console.log(
      `[cj freight] USPS+ not found, using cheapest: ${sorted[0].logisticName} $${sorted[0].logisticPrice}`
    );
    return sorted[0].logisticPrice;
  } catch (error) {
    console.error('[cj freight] API call failed:', error);
    return null;
  }
}
