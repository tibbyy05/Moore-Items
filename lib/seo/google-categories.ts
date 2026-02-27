/**
 * Maps MooreItems category slugs to Google Product Taxonomy IDs and names.
 * See: https://support.google.com/merchants/answer/6324436
 */

interface GoogleCategory {
  id: number;
  name: string;
}

const GOOGLE_CATEGORY_MAP: Record<string, GoogleCategory> = {
  'home-furniture': { id: 436, name: 'Furniture' },
  'fashion': { id: 166, name: 'Apparel & Accessories' },
  'health-beauty': { id: 469, name: 'Health & Beauty' },
  'jewelry': { id: 188, name: 'Apparel & Accessories > Jewelry' },
  'garden-outdoor': { id: 2962, name: 'Home & Garden > Lawn & Garden' },
  'pet-supplies': { id: 1, name: 'Animals & Pet Supplies' },
  'kitchen-dining': { id: 668, name: 'Home & Garden > Kitchen & Dining' },
  'electronics': { id: 222, name: 'Electronics' },
  'tools-hardware': { id: 1167, name: 'Hardware' },
  'kids-toys': { id: 1253, name: 'Toys & Games' },
  'sports-outdoors': { id: 990, name: 'Sporting Goods' },
  'storage-organization': { id: 623, name: 'Home & Garden > Household Supplies > Storage & Organization' },
};

export function getGoogleCategory(slug: string): GoogleCategory {
  return GOOGLE_CATEGORY_MAP[slug] || { id: 8, name: 'Arts & Entertainment' };
}
