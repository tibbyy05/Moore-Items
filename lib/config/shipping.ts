import { createAdminClient } from '@/lib/supabase/admin';

export const DEFAULT_SHIPPING_CONFIG = {
  // Master controls
  freeShippingEnabled: true,
  freeShippingThreshold: 50,
  freeShippingWeightCapGrams: 10000,

  // CJ real-time quotes
  useCJFreightQuotes: true,
  freightMarkupPercent: 15,

  // Fallback flat rate (used when CJ quotes disabled or fail)
  flatRateShipping: 4.99,

  // Minimum shipping charge (even with CJ quotes, never charge less than this)
  minimumShippingCharge: 2.99,
};

export type ShippingConfig = typeof DEFAULT_SHIPPING_CONFIG;

export async function getShippingConfig(): Promise<ShippingConfig> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('mi_settings')
      .select('value')
      .eq('key', 'shipping_config')
      .maybeSingle();

    if (data?.value && typeof data.value === 'object') {
      return { ...DEFAULT_SHIPPING_CONFIG, ...(data.value as Partial<ShippingConfig>) };
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
