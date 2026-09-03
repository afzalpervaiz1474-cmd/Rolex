export interface Collection {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image_url: string;
  featured: boolean;
  sort_order: number;
  created_at: string;
  product_count?: number;
}

export interface Spec {
  label: string;
  value: string;
}

export type ProductStatus = 'active' | 'draft' | 'archived';

export interface Product {
  id: number;
  slug: string;
  name: string;
  collection_id: number | null;
  short_description: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  sku: string;
  stock: number;
  status: ProductStatus;
  featured: boolean;
  images: string[];
  specs: Spec[];
  features: string[];
  materials: string;
  rating: number;
  review_count: number;
  created_at: string;
  updated_at: string;
  collection?: { id: number; name: string; slug: string } | null;
}

export interface CartItem {
  product_id: number;
  slug: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  sku: string;
  collection: string;
}

export interface ShippingAddress {
  full_name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone: string;
}

export interface Address extends ShippingAddress {
  id: number;
  user_id: string;
  label: string;
  is_default: boolean;
  created_at: string;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface OrderItem {
  product_id: number;
  name: string;
  slug: string;
  sku: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: number;
  order_number: string;
  user_id: string | null;
  email: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon_code: string | null;
  shipping_address: ShippingAddress;
  payment_method: string;
  payment_last4: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: number;
  product_id: number;
  user_id: string | null;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  status: ReviewStatus;
  created_at: string;
  product?: { id: number; name: string; slug: string; image: string } | null;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export interface CouponValidation {
  valid: boolean;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  discount: number;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'admin';
  phone: string;
  avatar_url: string;
  created_at: string;
}

export interface Customer extends Profile {
  order_count: number;
  total_spent: number;
  last_order_at: string | null;
}

export type Settings = Record<string, string>;

export interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'archived';
  created_at: string;
}

export interface AdminStats {
  revenue: number;
  revenue_30d: number;
  revenue_growth: number;
  orders_count: number;
  orders_30d: number;
  orders_growth: number;
  average_order: number;
  customers_count: number;
  products_count: number;
  active_products: number;
  pending_orders: number;
  pending_reviews: number;
  new_messages: number;
  status_counts: Record<string, number>;
  low_stock: { id: number; name: string; slug: string; stock: number; image: string }[];
  recent_orders: Order[];
  revenue_by_day: { date: string; revenue: number }[];
  top_products: { product_id: number; name: string; slug: string; image: string; quantity: number; revenue: number }[];
}
