export interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  image: string;
  reviews: Review[];
  rating: number;
  numReviews: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  qty: number;
  image: string;
}

export interface ShippingAddress {
  address: string;
  city: string;
  postalCode: string;
  country: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  status: 'pending' | 'shipped' | 'delivered';
  couponCode?: string;
  discountAmount: number;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  wishlist: string[];
  token?: string;
}

export interface RecentOrder {
  id: string;
  customerName: string;
  totalPrice: number;
  status: 'pending' | 'shipped' | 'delivered';
  createdAt: string;
}

export interface AdminStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  categoryCounts: Record<string, number>;
  recentOrders: RecentOrder[];
}
