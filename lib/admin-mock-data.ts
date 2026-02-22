export interface AdminProduct {
  id: string;
  cjPid: string;
  name: string;
  category: string;
  cjPrice: number;
  shippingCost: number;
  retailPrice: number;
  marginPercent: number;
  markupMultiplier: number;
  stockCount: number;
  warehouse: 'US' | 'CN';
  rating: number;
  salesCount: number;
  status: 'active' | 'out_of_stock' | 'low_stock' | 'pending' | 'hidden';
  image: string;
}

export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  variantName?: string;
}

export interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface AdminOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  itemCount: number;
  total: number;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  fulfillmentStatus: 'unfulfilled' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  cjOrderId: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  createdAt: string;
  shippingAddress: ShippingAddress;
}

export interface AdminCustomer {
  id: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  orderCount: number;
  totalSpent: number;
  status: 'active' | 'inactive';
  lastOrderDate: string;
  joinedAt: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

export interface LandingPage {
  id: string;
  title: string;
  url: string;
  campaign: string;
  name: string;
  slug: string;
  headline: string;
  subheadline: string;
  heroImage: string;
  productIds: string[];
  productsCount: number;
  views: number;
  conversions: number;
  conversionRate: number;
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
}

export interface AdCampaign {
  id: string;
  name: string;
  platform: string;
  status: 'active' | 'paused' | 'ended';
  dailyBudget: number;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  conversions: number;
  revenue: number;
  roas: number;
  landingPageId: string | null;
  startDate: string;
  endDate: string | null;
}

export const adminProducts: AdminProduct[] = [
  {
    id: 'prod-1',
    cjPid: 'CJ234567890',
    name: 'Elegant Floral Maxi Dress',
    category: "Women's Fashion",
    cjPrice: 32.50,
    shippingCost: 5.75,
    retailPrice: 89.99,
    marginPercent: 57.4,
    markupMultiplier: 2.35,
    stockCount: 45,
    warehouse: 'US',
    rating: 4.7,
    salesCount: 248,
    status: 'active',
    image: 'https://images.pexels.com/photos/1055691/pexels-photo-1055691.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'prod-2',
    cjPid: 'CJ345678901',
    name: 'Premium Leather Crossbody Bag',
    category: "Women's Fashion",
    cjPrice: 48.00,
    shippingCost: 6.25,
    retailPrice: 124.99,
    marginPercent: 56.5,
    markupMultiplier: 2.30,
    stockCount: 28,
    warehouse: 'US',
    rating: 4.9,
    salesCount: 412,
    status: 'active',
    image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'prod-3',
    cjPid: 'CJ456789012',
    name: 'Wireless Pet Water Fountain',
    category: 'Pet Supplies',
    cjPrice: 18.50,
    shippingCost: 4.25,
    retailPrice: 42.99,
    marginPercent: 47.0,
    markupMultiplier: 1.89,
    stockCount: 156,
    warehouse: 'CN',
    rating: 4.6,
    salesCount: 892,
    status: 'active',
    image: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'prod-4',
    cjPid: 'CJ567890123',
    name: 'Orthopedic Pet Bed with Memory Foam',
    category: 'Pet Supplies',
    cjPrice: 35.00,
    shippingCost: 7.50,
    retailPrice: 79.99,
    marginPercent: 46.9,
    markupMultiplier: 1.88,
    stockCount: 34,
    warehouse: 'US',
    rating: 4.8,
    salesCount: 623,
    status: 'active',
    image: 'https://images.pexels.com/photos/4587998/pexels-photo-4587998.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'prod-5',
    cjPid: 'CJ678901234',
    name: 'Modern Ceramic Planter Set',
    category: 'Home & Garden',
    cjPrice: 22.00,
    shippingCost: 6.00,
    retailPrice: 54.99,
    marginPercent: 49.1,
    markupMultiplier: 1.96,
    stockCount: 67,
    warehouse: 'CN',
    rating: 4.5,
    salesCount: 178,
    status: 'active',
    image: 'https://images.pexels.com/photos/6208086/pexels-photo-6208086.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'prod-6',
    cjPid: 'CJ789012345',
    name: 'Vitamin C Serum with Hyaluronic Acid',
    category: 'Health & Beauty',
    cjPrice: 12.00,
    shippingCost: 3.50,
    retailPrice: 28.99,
    marginPercent: 46.6,
    markupMultiplier: 1.87,
    stockCount: 412,
    warehouse: 'US',
    rating: 4.8,
    salesCount: 2156,
    status: 'active',
    image: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'prod-7',
    cjPid: 'CJ890123456',
    name: 'Wireless Bluetooth Earbuds Pro',
    category: 'Electronics',
    cjPrice: 28.00,
    shippingCost: 4.75,
    retailPrice: 79.99,
    marginPercent: 59.0,
    markupMultiplier: 2.44,
    stockCount: 12,
    warehouse: 'US',
    rating: 4.6,
    salesCount: 1834,
    status: 'low_stock',
    image: 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 'prod-8',
    cjPid: 'CJ901234567',
    name: 'Cast Iron Skillet - Pre-Seasoned',
    category: 'Kitchen',
    cjPrice: 18.50,
    shippingCost: 5.25,
    retailPrice: 39.99,
    marginPercent: 40.6,
    markupMultiplier: 1.68,
    stockCount: 0,
    warehouse: 'US',
    rating: 4.9,
    salesCount: 1567,
    status: 'out_of_stock',
    image: 'https://images.pexels.com/photos/6412691/pexels-photo-6412691.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

export const adminOrders: AdminOrder[] = [
  {
    id: 'order-1',
    orderNumber: 'MI-10247',
    customerName: 'Sarah Johnson',
    customerEmail: 'sarah.j@example.com',
    items: [
      { name: 'Elegant Floral Maxi Dress', quantity: 1, price: 89.99, variantName: 'Blue / Medium' },
      { name: 'Premium Leather Crossbody Bag', quantity: 1, price: 124.99, variantName: 'Black' },
    ],
    itemCount: 2,
    total: 214.98,
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    cjOrderId: 'CJ-89237461',
    trackingNumber: '1Z999AA10123456784',
    carrier: 'UPS',
    createdAt: '2026-02-14T10:30:00Z',
    shippingAddress: {
      name: 'Sarah Johnson',
      street: '123 Main St',
      city: 'Austin',
      state: 'TX',
      zip: '78701',
      country: 'USA',
    },
  },
  {
    id: 'order-2',
    orderNumber: 'MI-10246',
    customerName: 'Michael Chen',
    customerEmail: 'mchen@example.com',
    items: [
      { name: 'Wireless Pet Water Fountain', quantity: 2, price: 42.99 },
      { name: 'Orthopedic Pet Bed with Memory Foam', quantity: 1, price: 79.99, variantName: 'Large - Gray' },
    ],
    itemCount: 3,
    total: 165.97,
    paymentStatus: 'paid',
    fulfillmentStatus: 'processing',
    cjOrderId: 'CJ-89237460',
    trackingNumber: null,
    carrier: null,
    createdAt: '2026-02-14T09:15:00Z',
    shippingAddress: {
      name: 'Michael Chen',
      street: '456 Oak Ave',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'USA',
    },
  },
  {
    id: 'order-3',
    orderNumber: 'MI-10245',
    customerName: 'Emily Rodriguez',
    customerEmail: 'emily.r@example.com',
    items: [
      { name: 'Vitamin C Serum with Hyaluronic Acid', quantity: 3, price: 28.99 },
    ],
    itemCount: 3,
    total: 86.97,
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    cjOrderId: 'CJ-89237459',
    trackingNumber: '9400111899562838472984',
    carrier: 'USPS',
    createdAt: '2026-02-13T14:22:00Z',
    shippingAddress: {
      name: 'Emily Rodriguez',
      street: '789 Pine Rd',
      city: 'Miami',
      state: 'FL',
      zip: '33101',
      country: 'USA',
    },
  },
  {
    id: 'order-4',
    orderNumber: 'MI-10244',
    customerName: 'David Park',
    customerEmail: 'dpark@example.com',
    items: [
      { name: 'Wireless Bluetooth Earbuds Pro', quantity: 1, price: 79.99, variantName: 'Black' },
    ],
    itemCount: 1,
    total: 79.99,
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    cjOrderId: 'CJ-89237458',
    trackingNumber: '1Z999AA10123456785',
    carrier: 'UPS',
    createdAt: '2026-02-13T11:45:00Z',
    shippingAddress: {
      name: 'David Park',
      street: '321 Elm St',
      city: 'Seattle',
      state: 'WA',
      zip: '98101',
      country: 'USA',
    },
  },
  {
    id: 'order-5',
    orderNumber: 'MI-10243',
    customerName: 'Jessica Martinez',
    customerEmail: 'jmartinez@example.com',
    items: [
      { name: 'Modern Ceramic Planter Set', quantity: 2, price: 54.99 },
    ],
    itemCount: 2,
    total: 109.98,
    paymentStatus: 'paid',
    fulfillmentStatus: 'unfulfilled',
    cjOrderId: null,
    trackingNumber: null,
    carrier: null,
    createdAt: '2026-02-15T08:12:00Z',
    shippingAddress: {
      name: 'Jessica Martinez',
      street: '555 Cedar Ln',
      city: 'Denver',
      state: 'CO',
      zip: '80201',
      country: 'USA',
    },
  },
];

export const adminCustomers: AdminCustomer[] = [
  {
    id: 'cust-1',
    name: 'Sarah Johnson',
    email: 'sarah.j@example.com',
    phone: '(512) 555-0123',
    location: 'Austin, TX',
    orderCount: 5,
    totalSpent: 687.42,
    status: 'active',
    lastOrderDate: '2026-02-14',
    joinedAt: '2025-11-20',
  },
  {
    id: 'cust-2',
    name: 'Michael Chen',
    email: 'mchen@example.com',
    phone: '(415) 555-0187',
    location: 'San Francisco, CA',
    orderCount: 3,
    totalSpent: 342.89,
    status: 'active',
    lastOrderDate: '2026-02-14',
    joinedAt: '2026-01-05',
  },
  {
    id: 'cust-3',
    name: 'Emily Rodriguez',
    email: 'emily.r@example.com',
    phone: '(305) 555-0142',
    location: 'Miami, FL',
    orderCount: 8,
    totalSpent: 1245.67,
    status: 'active',
    lastOrderDate: '2026-02-13',
    joinedAt: '2025-09-15',
  },
  {
    id: 'cust-4',
    name: 'David Park',
    email: 'dpark@example.com',
    phone: '(206) 555-0198',
    location: 'Seattle, WA',
    orderCount: 2,
    totalSpent: 189.50,
    status: 'active',
    lastOrderDate: '2026-02-13',
    joinedAt: '2026-01-28',
  },
  {
    id: 'cust-5',
    name: 'Jessica Martinez',
    email: 'jmartinez@example.com',
    phone: '(303) 555-0156',
    location: 'Denver, CO',
    orderCount: 1,
    totalSpent: 109.98,
    status: 'active',
    lastOrderDate: '2026-02-15',
    joinedAt: '2026-02-15',
  },
  {
    id: 'cust-6',
    name: 'Robert Taylor',
    email: 'rtaylor@example.com',
    phone: '(617) 555-0134',
    location: 'Boston, MA',
    orderCount: 12,
    totalSpent: 2134.56,
    status: 'active',
    lastOrderDate: '2026-02-12',
    joinedAt: '2025-08-10',
  },
  {
    id: 'cust-7',
    name: 'Amanda White',
    email: 'awhite@example.com',
    phone: '(404) 555-0176',
    location: 'Atlanta, GA',
    orderCount: 4,
    totalSpent: 456.78,
    status: 'active',
    lastOrderDate: '2026-02-11',
    joinedAt: '2025-12-03',
  },
  {
    id: 'cust-8',
    name: 'Christopher Lee',
    email: 'clee@example.com',
    phone: '(503) 555-0189',
    location: 'Portland, OR',
    orderCount: 6,
    totalSpent: 823.45,
    status: 'inactive',
    lastOrderDate: '2026-02-10',
    joinedAt: '2025-10-22',
  },
];

export const revenueData: RevenueData[] = [
  { date: '2026-02-09', revenue: 842.50, orders: 18 },
  { date: '2026-02-10', revenue: 1156.80, orders: 24 },
  { date: '2026-02-11', revenue: 967.25, orders: 21 },
  { date: '2026-02-12', revenue: 1324.60, orders: 28 },
  { date: '2026-02-13', revenue: 1589.40, orders: 32 },
  { date: '2026-02-14', revenue: 1247.80, orders: 26 },
  { date: '2026-02-15', revenue: 0, orders: 0 },
];

export const landingPages: LandingPage[] = [
  {
    id: 'lp-1',
    title: 'Pet Favorites - Q1 2026',
    url: '/lp/pet-favorites',
    campaign: 'Pet Supplies',
    name: 'Pet Favorites',
    slug: 'pet-favorites',
    headline: 'Everything Your Pet Needs',
    subheadline: 'Curated essentials for happy, healthy pets',
    heroImage: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200',
    productIds: ['prod-3', 'prod-4'],
    productsCount: 2,
    views: 3524,
    conversions: 127,
    conversionRate: 3.6,
    status: 'active',
    createdAt: '2026-01-15',
  },
  {
    id: 'lp-2',
    title: 'Summer Beauty Essentials',
    url: '/lp/summer-beauty',
    campaign: 'Beauty & Health',
    name: 'Summer Beauty Essentials',
    slug: 'summer-beauty',
    headline: 'Glow All Summer Long',
    subheadline: 'Premium skincare for radiant skin',
    heroImage: 'https://images.pexels.com/photos/3762879/pexels-photo-3762879.jpeg?auto=compress&cs=tinysrgb&w=1200',
    productIds: ['prod-6'],
    productsCount: 1,
    views: 5892,
    conversions: 234,
    conversionRate: 4.0,
    status: 'active',
    createdAt: '2026-01-20',
  },
  {
    id: 'lp-3',
    title: 'Work From Home Setup',
    url: '/lp/wfh-setup',
    campaign: 'Tech Essentials',
    name: 'Work From Home Setup',
    slug: 'wfh-setup',
    headline: 'Your Perfect Home Office',
    subheadline: 'Upgrade your workspace for maximum productivity',
    heroImage: 'https://images.pexels.com/photos/3825517/pexels-photo-3825517.jpeg?auto=compress&cs=tinysrgb&w=1200',
    productIds: ['prod-7'],
    productsCount: 1,
    views: 2156,
    conversions: 68,
    conversionRate: 3.2,
    status: 'inactive',
    createdAt: '2026-02-01',
  },
  {
    id: 'lp-4',
    title: 'Kitchen Must-Haves',
    url: '/lp/kitchen-essentials',
    campaign: 'Home & Kitchen',
    name: 'Kitchen Must-Haves',
    slug: 'kitchen-essentials',
    headline: 'Cook Like a Chef',
    subheadline: 'Professional-grade kitchen tools for home cooks',
    heroImage: 'https://images.pexels.com/photos/6412691/pexels-photo-6412691.jpeg?auto=compress&cs=tinysrgb&w=1200',
    productIds: ['prod-8'],
    productsCount: 1,
    views: 1823,
    conversions: 45,
    conversionRate: 2.5,
    status: 'active',
    createdAt: '2026-02-05',
  },
];

export const adCampaigns: AdCampaign[] = [
  {
    id: 'camp-1',
    name: 'Pet Supplies - Q1 2026',
    platform: 'Google Ads',
    status: 'active',
    dailyBudget: 150.00,
    spend: 1847.50,
    impressions: 124580,
    clicks: 3742,
    ctr: 3.0,
    cpc: 0.49,
    conversions: 127,
    revenue: 5456.73,
    roas: 2.95,
    landingPageId: 'lp-1',
    startDate: '2026-01-15',
    endDate: null,
  },
  {
    id: 'camp-2',
    name: 'Summer Beauty - Feb Special',
    platform: 'Facebook',
    status: 'active',
    dailyBudget: 200.00,
    spend: 2680.00,
    impressions: 189245,
    clicks: 5673,
    ctr: 3.0,
    cpc: 0.47,
    conversions: 234,
    revenue: 6783.66,
    roas: 2.53,
    landingPageId: 'lp-2',
    startDate: '2026-02-01',
    endDate: null,
  },
  {
    id: 'camp-3',
    name: 'WFH Tech Bundle',
    platform: 'Google Ads',
    status: 'paused',
    dailyBudget: 100.00,
    spend: 892.40,
    impressions: 67234,
    clicks: 1876,
    ctr: 2.8,
    cpc: 0.48,
    conversions: 68,
    revenue: 5439.32,
    roas: 6.10,
    landingPageId: 'lp-3',
    startDate: '2026-02-01',
    endDate: null,
  },
  {
    id: 'camp-4',
    name: 'Kitchen Essentials',
    platform: 'Instagram',
    status: 'active',
    dailyBudget: 80.00,
    spend: 560.00,
    impressions: 45678,
    clicks: 1234,
    ctr: 2.7,
    cpc: 0.45,
    conversions: 45,
    revenue: 1799.55,
    roas: 3.21,
    landingPageId: 'lp-4',
    startDate: '2026-02-05',
    endDate: null,
  },
  {
    id: 'camp-5',
    name: 'Valentine\'s Day Jewelry',
    platform: 'Facebook',
    status: 'ended',
    dailyBudget: 300.00,
    spend: 4200.00,
    impressions: 312456,
    clicks: 9873,
    ctr: 3.2,
    cpc: 0.43,
    conversions: 423,
    revenue: 18945.77,
    roas: 4.51,
    landingPageId: null,
    startDate: '2026-02-01',
    endDate: '2026-02-14',
  },
];
