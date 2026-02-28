import { createAdminClient } from '@/lib/supabase/admin';

export interface WeightTier {
  maxGrams: number | null; // null = unlimited (highest tier)
  price: number;
  label: string;
}

export interface ShippingConfig {
  // Master controls
  freeShippingEnabled: boolean;
  freeShippingThreshold: number;
  freeShippingWeightCapGrams: number;

  // CJ real-time quotes (kept as future option)
  useCJFreightQuotes: boolean;
  freightMarkupPercent: number;
  minimumShippingCharge: number;

  // Weight-based tiers (primary shipping calculation)
  weightTiers: WeightTier[];
  unknownWeightRate: number;

  // Fallback flat rate (last resort)
  flatRateShipping: number;
}

export const DEFAULT_SHIPPING_CONFIG: ShippingConfig = {
  freeShippingEnabled: true,
  freeShippingThreshold: 50,
  freeShippingWeightCapGrams: 10000,

  useCJFreightQuotes: true,
  freightMarkupPercent: 15,
  minimumShippingCharge: 2.99,

  weightTiers: [
    { maxGrams: 500, price: 4.99, label: 'Light (under 1 lb)' },
    { maxGrams: 2000, price: 7.99, label: 'Standard (1-4 lbs)' },
    { maxGrams: 5000, price: 12.99, label: 'Medium (4-11 lbs)' },
    { maxGrams: 15000, price: 19.99, label: 'Heavy (11-33 lbs)' },
    { maxGrams: null, price: 29.99, label: 'Extra Heavy (33+ lbs)' },
  ],
  unknownWeightRate: 7.99,

  flatRateShipping: 4.99,
};

export async function getShippingConfig(): Promise<ShippingConfig> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('mi_settings')
      .select('value')
      .eq('key', 'shipping_config')
      .maybeSingle();

    if (data?.value && typeof data.value === 'object') {
      const saved = data.value as Partial<ShippingConfig>;
      return {
        ...DEFAULT_SHIPPING_CONFIG,
        ...saved,
        // Ensure weightTiers is always a valid array
        weightTiers:
          Array.isArray(saved.weightTiers) && saved.weightTiers.length > 0
            ? saved.weightTiers
            : DEFAULT_SHIPPING_CONFIG.weightTiers,
      };
    }
  } catch (error) {
    console.error('[shipping] Failed to load config from DB, using defaults:', error);
  }

  return { ...DEFAULT_SHIPPING_CONFIG };
}

export async function saveShippingConfig(config: ShippingConfig): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('mi_settings')
    .upsert(
      { key: 'shipping_config', value: config, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) {
    throw new Error(`Failed to save shipping config: ${error.message}`);
  }
}
