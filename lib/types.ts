export interface Category {
  id: string;
  name: string;
  slug: string;
  iconName: string;
  productCount: number;
  gradient: string;
  iconColor: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  color?: string;
  size?: string;
  price: number;
  inStock: boolean;
  imageUrl?: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  createdAt?: string;
  images: string[];
  rating: number;
  reviewCount: number;
  category: string;
  categoryLabel: string;
  badge: 'NEW' | 'TRENDING' | 'SALE' | 'BESTSELLER' | null;
  variants: ProductVariant[];
  description: string;
  shippingDays: string;
  warehouse: 'US' | 'CN' | 'CA';
  isDigital?: boolean;
  inStock: boolean;
  stockCount: number;
}

export interface Review {
  id: string;
  productId: string;
  authorName: string;
  rating: number;
  date: string;
  title: string;
  body: string;
  verified: boolean;
}

export interface CartItem {
  productId: string;
  slug: string;
  variantId: string | null;
  name: string;
  variantName?: string;
  price: number;
  quantity: number;
  image: string;
  warehouse: 'US' | 'CN' | 'CA';
  isDigital?: boolean;
}
