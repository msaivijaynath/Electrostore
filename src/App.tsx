import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Heart,
  ShoppingCart,
  Trash2,
  Tag,
  CheckCircle,
  X,
  Plus,
  Minus,
  Briefcase,
  Layers,
  Users,
  TrendingUp,
  Search,
  Filter,
  ArrowRight,
  ShieldAlert,
  Clock,
  Star,
  MapPin,
  Lock,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

import { Product, CartItem, User, Order, AdminStats, ShippingAddress } from './types';
import Navbar from './components/Navbar.tsx';
import ProductCard from './components/ProductCard.tsx';
const ProductCardAny = ProductCard as any;
import ReviewSection from './components/ReviewSection.tsx';
import CheckoutForm from './components/CheckoutForm.tsx';
import StatsView from './components/admin/StatsView.tsx';
import ProductsView from './components/admin/ProductsView.tsx';
import OrdersView from './components/admin/OrdersView.tsx';

// Simple unique ID for Toast notifications
let toastIdCounter = 0;

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);

  // Cart State (Initialized from LocalStorage if available)
  const [cart, setCart] = useState<CartItem[]>(() => {
    const cached = localStorage.getItem('electro_cart');
    return cached ? JSON.parse(cached) : [];
  });

  // Client Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSort, setSelectedSort] = useState('');
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountPercent: number } | null>(null);

  // Navigation State
  const [currentView, setCurrentView] = useState<'catalog' | 'product' | 'cart' | 'checkout' | 'orders' | 'admin' | 'login' | 'register'>('catalog');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Loading indicator states
  const [loading, setLoading] = useState(true);
  const [adminTab, setAdminTab] = useState<'stats' | 'products' | 'orders'>('stats');

  // Load Session on Startup
  useEffect(() => {
    const savedToken = localStorage.getItem('electro_token');
    const savedUser = localStorage.getItem('electro_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    fetchProducts();
    setLoading(false);
  }, []);

  // Sync Cart to LocalStorage on modification
  useEffect(() => {
    localStorage.setItem('electro_cart', JSON.stringify(cart));
  }, [cart]);

  // Synchronize Hash Routing State
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || '#/';
      if (hash === '#/' || hash.startsWith('#/?')) {
        setCurrentView('catalog');
      } else if (hash.startsWith('#/product/')) {
        const id = hash.replace('#/product/', '');
        setSelectedProductId(id);
        setCurrentView('product');
        fetchSingleProduct(id);
      } else if (hash === '#/cart') {
        setCurrentView('cart');
      } else if (hash === '#/checkout') {
        setCurrentView('checkout');
      } else if (hash === '#/orders') {
        setCurrentView('orders');
        fetchUserOrders();
      } else if (hash === '#/admin') {
        setCurrentView('admin');
        fetchAdminData();
      } else if (hash === '#/login') {
        setCurrentView('login');
      } else if (hash === '#/register') {
        setCurrentView('register');
      }
    };

    window.addEventListener('hashchange', handleHash);
    handleHash();
    return () => window.removeEventListener('hashchange', handleHash);
  }, [token]);

  // Toast Notification System
  const triggerToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = ++toastIdCounter;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // --- API Methods ---

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('search', searchQuery);
      if (selectedCategory !== 'All') queryParams.append('category', selectedCategory);
      if (selectedSort) queryParams.append('sort', selectedSort);

      const res = await fetch(`/api/products?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
    } catch (err: any) {
      triggerToast(err.message || 'Error fetching catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when filtration inputs alter
  useEffect(() => {
    fetchProducts();
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, selectedSort]);

  const fetchSingleProduct = async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      const data = await res.json();
      setSelectedProduct(data);
    } catch (err: any) {
      triggerToast('Product details failed to resolve', 'error');
      window.location.hash = '#/';
    }
  };

  const fetchUserOrders = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders/my-orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      const data = await res.json();
      setOrders(data);
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  const fetchAdminData = async () => {
    if (!token || user?.role !== 'admin') return;
    try {
      // Fetch Statistics
      const statsRes = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setAdminStats(statsData);
      }

      // Fetch All Store Orders
      const ordersRes = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setOrders(ordersData);
      }
    } catch (err: any) {
      triggerToast('Admin panel sync failed', 'error');
    }
  };

  const handleLogin = async (e: React.FormEvent, credentials: { email: string; password: string }) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Login failed');

      localStorage.setItem('electro_token', data.token);
      localStorage.setItem('electro_user', JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        wishlist: data.wishlist || []
      }));

      setToken(data.token);
      setUser(data);
      triggerToast(`Welcome back, ${data.name}!`, 'success');
      
      // Redirect to catalog or admin if admin
      window.location.hash = data.role === 'admin' ? '#/admin' : '#/';
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  const handleRegister = async (e: React.FormEvent, profile: { name: string; email: string; password: string }) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Registration failed');

      localStorage.setItem('electro_token', data.token);
      localStorage.setItem('electro_user', JSON.stringify({
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role,
        wishlist: []
      }));

      setToken(data.token);
      setUser(data);
      triggerToast(`Account created successfully! Welcome, ${data.name}!`, 'success');
      window.location.hash = '#/';
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('electro_token');
    localStorage.removeItem('electro_user');
    setToken(null);
    setUser(null);
    setCart([]);
    setAppliedCoupon(null);
    setCouponCode('');
    triggerToast('Logged out successfully', 'info');
    window.location.hash = '#/';
  };

  // --- Cart Operations ---

  const handleAddToCart = (p: Product) => {
    const existing = cart.find((item) => item.productId === p.id);
    if (existing) {
      if (existing.qty >= p.stock) {
        triggerToast(`Cannot exceed stock limit (${p.stock} units) for ${p.name}`, 'error');
        return;
      }
      setCart(
        cart.map((item) =>
          item.productId === p.id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { productId: p.id, name: p.name, price: p.price, qty: 1, image: p.image }]);
    }
    triggerToast(`${p.name} added to cart`, 'success');
  };

  const updateCartQty = (productId: string, diff: number) => {
    const item = cart.find((i) => i.productId === productId);
    const product = products.find((p) => p.id === productId);

    if (item && product) {
      const nextQty = item.qty + diff;
      if (nextQty <= 0) {
        handleRemoveFromCart(productId);
        return;
      }
      if (nextQty > product.stock) {
        triggerToast(`Insufficient units in inventory. Limit is ${product.stock} units.`, 'error');
        return;
      }
      setCart(cart.map((i) => (i.productId === productId ? { ...i, qty: nextQty } : i)));
    }
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart(cart.filter((i) => i.productId !== productId));
    triggerToast('Item removed from cart', 'info');
  };

  const applyPromoCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    try {
      const res = await fetch(`/api/coupons/validate?code=${encodeURIComponent(couponCode)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invalid coupon');

      setAppliedCoupon(data);
      triggerToast(`Promo code ${data.code} applied! (${data.discountPercent}% discount)`, 'success');
    } catch (err: any) {
      triggerToast(err.message, 'error');
      setAppliedCoupon(null);
    }
  };

  // --- Checkout order processing ---

  const handlePlaceOrder = async (shippingAddress: ShippingAddress, couponCodeApplied?: string): Promise<boolean> => {
    if (!token) {
      triggerToast('You must login to proceed with checkouts', 'error');
      window.location.hash = '#/login';
      return false;
    }

    try {
      const orderItems = cart.map((i) => ({
        productId: i.productId,
        name: i.name,
        price: i.price,
        qty: i.qty,
        image: i.image
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          items: orderItems,
          shippingAddress,
          couponCode: couponCodeApplied
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Checkout failed');

      setCart([]);
      setAppliedCoupon(null);
      setCouponCode('');
      fetchProducts();
      triggerToast('Order submitted successfully! Simulated settlement finalized.', 'success');
      
      // Navigate to orders history
      window.location.hash = '#/orders';
      return true;
    } catch (err: any) {
      triggerToast(err.message, 'error');
      return false;
    }
  };

  // --- Wishlist toggling ---

  const handleToggleWishlist = async (productId: string) => {
    if (!token) {
      triggerToast('Please sign in to manage your wishlist', 'info');
      window.location.hash = '#/login';
      return;
    }

    try {
      const res = await fetch('/api/auth/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ productId })
      });

      if (!res.ok) throw new Error('Wishlist sync failed');
      const updatedWishlist = await res.json();

      if (user) {
        const updatedUser = { ...user, wishlist: updatedWishlist };
        setUser(updatedUser);
        localStorage.setItem('electro_user', JSON.stringify(updatedUser));
      }

      const isAdded = updatedWishlist.includes(productId);
      triggerToast(isAdded ? 'Added to wishlist' : 'Removed from wishlist', 'success');
    } catch (err: any) {
      triggerToast(err.message, 'error');
    }
  };

  // --- Product Reviews ---

  const handleAddReview = async (productId: string, ratingValue: number, commentValue: string): Promise<boolean> => {
    if (!token) return false;
    try {
      const res = await fetch(`/api/products/${productId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rating: ratingValue, comment: commentValue })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Review posting failed');

      // Update local state to show review instantly
      setSelectedProduct(data);
      setProducts(products.map((p) => (p.id === productId ? data : p)));
      triggerToast('Your review has been published!', 'success');
      return true;
    } catch (err: any) {
      triggerToast(err.message, 'error');
      return false;
    }
  };

  // --- Admin Catalog Mutations ---

  const handleAddProduct = async (productPayload: Omit<Product, 'id' | 'reviews' | 'rating' | 'numReviews' | 'createdAt'>): Promise<boolean> => {
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setProducts([data, ...products]);
      triggerToast(`Product ${data.name} added to catalog`, 'success');
      fetchAdminData(); // Refresh admin metrics
      return true;
    } catch (err: any) {
      triggerToast(err.message, 'error');
      return false;
    }
  };

  const handleUpdateProduct = async (id: string, productPayload: Partial<Product>): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(productPayload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setProducts(products.map((p) => (p.id === id ? data : p)));
      triggerToast(`Product ${data.name} updated successfully`, 'success');
      fetchAdminData(); // Refresh admin metrics
      return true;
    } catch (err: any) {
      triggerToast(err.message, 'error');
      return false;
    }
  };

  const handleDeleteProduct = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setProducts(products.filter((p) => p.id !== id));
      triggerToast('Product deleted from inventory', 'info');
      fetchAdminData(); // Refresh admin metrics
      return true;
    } catch (err: any) {
      triggerToast(err.message, 'error');
      return false;
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, nextStatus: 'pending' | 'shipped' | 'delivered'): Promise<boolean> => {
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setOrders(orders.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o)));
      triggerToast(`Order status updated to ${nextStatus}`, 'success');
      fetchAdminData(); // Refresh stats
      return true;
    } catch (err: any) {
      triggerToast(err.message, 'error');
      return false;
    }
  };

  // --- Math calculations ---

  const itemsSubtotal = cart.reduce((acc, curr) => acc + curr.price * curr.qty, 0);
  const discountAmount = appliedCoupon ? (itemsSubtotal * appliedCoupon.discountPercent) / 100 : 0;
  const totalPrice = parseFloat((itemsSubtotal - discountAmount).toFixed(2));

  // Client-side filtering logic for display lists
  const displayProducts = products.filter((p) => {
    const inWishlist = user?.wishlist?.includes(p.id) || false;
    if (showWishlistOnly && !inWishlist) return false;
    return true;
  });

  // Client Pagination chunk
  const totalProductsCount = displayProducts.length;
  const totalPages = Math.ceil(totalProductsCount / itemsPerPage);
  const paginatedProducts = displayProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      
      {/* Toast Alert Portal */}
      <div className="fixed bottom-5 right-5 z-50 space-y-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              key={t.id}
              className={`p-4 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 pointer-events-auto max-w-sm ${
                t.type === 'success'
                  ? 'bg-emerald-950 text-emerald-100 border-emerald-900'
                  : t.type === 'error'
                  ? 'bg-red-950 text-red-100 border-red-900'
                  : 'bg-indigo-950 text-indigo-100 border-indigo-900'
              }`}
            >
              <CheckCircle className={`w-4 h-4 ${t.type === 'success' ? 'text-emerald-400' : t.type === 'error' ? 'text-red-400' : 'text-indigo-400'}`} />
              <span>{t.message}</span>
              <button
                onClick={() => setToasts((prev) => prev.filter((item) => item.id !== t.id))}
                className="ml-auto p-0.5 rounded hover:bg-white/10"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Navbar Header */}
      <Navbar
        user={user}
        cartCount={cart.reduce((sum, item) => sum + item.qty, 0)}
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onLogout={handleLogout}
      />

      {/* Main Workspace */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {loading ? (
          <div className="py-24 flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {/* 1. CATALOG SCREEN */}
            {currentView === 'catalog' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="catalog-view"
                className="space-y-8"
              >
                {/* Hero Promotion Panel */}
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 rounded-3xl text-white p-8 sm:p-12 relative overflow-hidden shadow-xl border border-indigo-950">
                  <div className="absolute inset-0 bg-radial-gradient from-transparent to-black/30"></div>
                  <div className="relative z-10 max-w-xl space-y-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-500 text-white px-3 py-1 rounded-full">
                      Exclusive Launch Promotion
                    </span>
                    <h2 className="text-3xl sm:text-5xl font-extrabold font-display leading-tight tracking-tight">
                      Tomorrow's Electronics, Settle Today.
                    </h2>
                    <p className="text-sm text-indigo-200/85 leading-relaxed">
                      Upgrade your workstation setup with high-fidelity mechanical, acoustic, and wear gears. Apply promo codes for mock checkout concessions.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-3">
                      <span className="text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 font-mono">WELCOME50 (50% Off)</span>
                      <span className="text-xs bg-white/10 px-3 py-1.5 rounded-lg border border-white/5 font-mono">SUPER30 (30% Off)</span>
                    </div>
                  </div>
                </div>

                {/* Search, Filter & Settings bar */}
                <div className="bg-white p-5 border border-slate-200 rounded-2xl shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  {/* Search query box */}
                  <div className="flex-grow max-w-lg relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4.5 h-4.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search premium electronics..."
                      className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white"
                    />
                  </div>

                  {/* Dynamic Category Badges */}
                  <div className="flex flex-wrap items-center gap-2">
                    {['All', 'Electronics', 'Wearables', 'Accessories', 'Mobiles'].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3.5 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Settings filter */}
                  <div className="flex items-center gap-2.5">
                    <select
                      value={selectedSort}
                      onChange={(e) => setSelectedSort(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/10 cursor-pointer"
                    >
                      <option value="">Newest Arrivals</option>
                      <option value="priceAsc">Price: Low to High</option>
                      <option value="priceDesc">Price: High to Low</option>
                      <option value="rating">Top Rated</option>
                    </select>

                    <button
                      onClick={() => {
                        if (!token) {
                          triggerToast('Please register or login to save your wishlist', 'info');
                          window.location.hash = '#/login';
                          return;
                        }
                        setShowWishlistOnly(!showWishlistOnly);
                      }}
                      className={`p-2 rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                        showWishlistOnly
                          ? 'bg-red-50 text-red-500 border-red-100'
                          : 'bg-slate-50 text-slate-500 border-slate-200/60 hover:bg-slate-100'
                      }`}
                      title="Show Wishlisted Items"
                    >
                      <Heart className={`w-4 h-4 ${showWishlistOnly ? 'fill-current' : ''}`} />
                      <span className="text-xs font-semibold hidden md:inline">Favorites</span>
                    </button>
                  </div>
                </div>

                {/* Catalog grid listing */}
                {paginatedProducts.length > 0 ? (
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      {paginatedProducts.map((p) => (
                        <ProductCardAny
                          key={p.id}
                          product={p}
                          user={user}
                          onProductClick={(id) => {
                            window.location.hash = `#/product/${id}`;
                            setSelectedProductId(id);
                            setCurrentView('product');
                          }}
                          onAddToCart={handleAddToCart}
                          onToggleWishlist={handleToggleWishlist}
                          isWishlisted={user?.wishlist?.includes(p.id) || false}
                        />
                      ))}
                    </div>

                    {/* Pagination Controllers */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-4 pt-4">
                        <button
                          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronLeft className="w-4 h-4 text-slate-600" />
                        </button>
                        <span className="text-xs font-semibold text-slate-500">
                          Page {currentPage} of {totalPages}
                        </span>
                        <button
                          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                          className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <ChevronRight className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-24 text-center bg-white border border-slate-200 rounded-3xl">
                    <div className="p-3.5 bg-slate-50 rounded-full w-fit mx-auto mb-3 text-slate-400">
                      <Filter className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">No items matched selection</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                      Try clearing search parameters, changing the category badges, or switching off wishlist favorites.
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. PRODUCT DETAIL VIEW SCREEN */}
            {currentView === 'product' && selectedProduct && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="product-details"
                className="space-y-6"
              >
                <button
                  onClick={() => {
                    window.location.hash = '#/';
                    setCurrentView('catalog');
                  }}
                  className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-indigo-600 transition-colors gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Catalog</span>
                </button>

                <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
                  {/* Image visualizer */}
                  <div className="bg-slate-50 rounded-2xl overflow-hidden aspect-video md:aspect-square flex items-center justify-center p-4">
                    <img
                      src={selectedProduct.image}
                      alt={selectedProduct.name}
                      className="object-contain max-h-96 w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).onerror = null;
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                  </div>

                  {/* Context parameters */}
                  <div className="flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <span className="px-3 py-1 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-600 uppercase tracking-wider inline-block">
                        {selectedProduct.category}
                      </span>
                      <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-900 leading-tight">
                        {selectedProduct.name}
                      </h1>

                      {selectedProduct.rating > 0 ? (
                        <div className="flex items-center text-amber-500 gap-1.5">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-sm font-bold text-slate-800">{selectedProduct.rating.toFixed(1)}</span>
                          <span className="text-xs text-slate-400">({selectedProduct.numReviews} buyer reviews)</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-1 rounded font-semibold">New Entry</span>
                      )}

                      <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
                        {selectedProduct.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <div className="flex items-center justify-between mb-5">
                        <div className="flex flex-col">
                          <span className="text-xs text-slate-400 font-semibold">Retail Price</span>
                          <span className="text-2xl font-black text-slate-950 font-display">${selectedProduct.price.toFixed(2)}</span>
                        </div>

                        <div>
                          {selectedProduct.stock > 0 ? (
                            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-100 font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                              {selectedProduct.stock} units available
                            </span>
                          ) : (
                            <span className="text-xs text-red-500 bg-red-50 border border-red-100 font-bold px-3 py-1.5 rounded-xl">
                              Out of Stock
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={() => {
                            if (user?.wishlist?.includes(selectedProduct.id)) {
                              handleToggleWishlist(selectedProduct.id);
                            } else {
                              handleToggleWishlist(selectedProduct.id);
                            }
                          }}
                          className={`p-3 rounded-xl border transition-all flex items-center justify-center cursor-pointer ${
                            user?.wishlist?.includes(selectedProduct.id)
                              ? 'bg-red-50 border-red-100 text-red-500'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-red-500'
                          }`}
                        >
                          <Heart className={`w-5 h-5 ${user?.wishlist?.includes(selectedProduct.id) ? 'fill-current' : ''}`} />
                        </button>

                        {selectedProduct.stock > 0 ? (
                          <button
                            onClick={() => handleAddToCart(selectedProduct)}
                            className="flex-grow py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                          >
                            <ShoppingCart className="w-4.5 h-4.5" />
                            <span>Add to Cart Basket</span>
                          </button>
                        ) : (
                          <button
                            disabled
                            className="flex-grow py-3 bg-slate-100 text-slate-400 rounded-xl text-sm font-semibold cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Lock className="w-4.5 h-4.5" />
                            <span>Out of Stock</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub reviews component */}
                <ReviewSection
                  product={selectedProduct}
                  user={user}
                  onAddReview={handleAddReview}
                />
              </motion.div>
            )}

            {/* 3. CART OVERVIEW SCREEN */}
            {currentView === 'cart' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="cart-view"
                className="space-y-6"
              >
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-display">Shopping Basket</h2>
                  <p className="text-xs text-slate-400">Review items in your cart and apply coupon codes</p>
                </div>

                {cart.length > 0 ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Cart Items Table (8 cols) */}
                    <div className="lg:col-span-8 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                      {cart.map((item) => (
                        <div key={item.productId} className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-b-0 last:pb-0">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-100 bg-slate-50 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                            <div className="min-w-0">
                              <h4 className="font-bold text-slate-900 text-sm truncate max-w-[200px] sm:max-w-xs">{item.name}</h4>
                              <p className="text-xs font-bold text-indigo-600">${item.price.toFixed(2)}</p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            {/* Quantity buttons */}
                            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                              <button
                                onClick={() => updateCartQty(item.productId, -1)}
                                className="p-2 hover:bg-slate-100 text-slate-500 cursor-pointer"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3.5 text-xs font-bold text-slate-800">{item.qty}</span>
                              <button
                                onClick={() => updateCartQty(item.productId, 1)}
                                className="p-2 hover:bg-slate-100 text-slate-500 cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <p className="font-extrabold text-slate-950 text-sm w-16 text-right">
                              ${(item.price * item.qty).toFixed(2)}
                            </p>

                            <button
                              onClick={() => handleRemoveFromCart(item.productId)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                              title="Delete from basket"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Cart Totals sidebar (4 cols) */}
                    <div className="lg:col-span-4 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm self-start space-y-6">
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">Checkout Settlement</h3>
                        
                        {/* Apply coupons form */}
                        <form onSubmit={applyPromoCoupon} className="space-y-2">
                          <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Have a promo coupon?</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value)}
                              className="flex-grow px-3 py-2 border border-slate-200 bg-slate-50 text-xs rounded-xl focus:bg-white"
                              placeholder="e.g. WELCOME50"
                            />
                            <button
                              type="submit"
                              className="px-3 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors"
                            >
                              Apply
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Line summaries */}
                      <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs font-semibold text-slate-500">
                        <div className="flex justify-between">
                          <span>Items Subtotal</span>
                          <span className="text-slate-800">${itemsSubtotal.toFixed(2)}</span>
                        </div>

                        {appliedCoupon && (
                          <div className="flex justify-between text-emerald-600 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/40">
                            <span>Promo Applied ({appliedCoupon.code})</span>
                            <span>-{appliedCoupon.discountPercent}% (-${discountAmount.toFixed(2)})</span>
                          </div>
                        )}

                        <div className="flex justify-between">
                          <span>Delivery</span>
                          <span className="text-emerald-600 font-bold">FREE</span>
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-3 flex justify-between items-baseline">
                          <span className="text-sm font-bold text-slate-800">Final Price</span>
                          <span className="text-lg font-extrabold text-indigo-600 font-display">${totalPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (!token) {
                            triggerToast('Please sign in or register to checkout', 'info');
                            window.location.hash = '#/login';
                            return;
                          }
                          window.location.hash = '#/checkout';
                          setCurrentView('checkout');
                        }}
                        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Settle Securely</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="py-24 text-center bg-white border border-slate-200 rounded-3xl">
                    <div className="p-3.5 bg-slate-50 rounded-full w-fit mx-auto mb-3 text-slate-400">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-slate-900 text-base">Your cart is empty</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1 mb-4">
                      Explore our premium gadgets catalog to find outstanding gear upgrades!
                    </p>
                    <button
                      onClick={() => {
                        window.location.hash = '#/';
                        setCurrentView('catalog');
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Browse Products
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. CHECKOUT SCREEN */}
            {currentView === 'checkout' && cart.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="checkout-view"
                className="space-y-6"
              >
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-display">Secure Transaction Settle</h2>
                  <p className="text-xs text-slate-400">Review address and payment options below</p>
                </div>

                <CheckoutForm
                  cart={cart}
                  totalPrice={totalPrice}
                  discountAmount={discountAmount}
                  couponCode={appliedCoupon?.code || ''}
                  onPlaceOrder={handlePlaceOrder}
                />
              </motion.div>
            )}

            {/* 5. CUSTOMER ORDERS HISTORIC VIEW */}
            {currentView === 'orders' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="orders-history"
                className="space-y-6"
              >
                <div className="border-b border-slate-200 pb-4">
                  <h2 className="text-xl font-bold text-slate-900 font-display">Purchase logs</h2>
                  <p className="text-xs text-slate-400">List of your historic transaction settlements</p>
                </div>

                <div className="space-y-4">
                  {orders.map((o) => (
                    <div key={o.id} className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4">
                      {/* Header log */}
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3 text-xs">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-slate-900 uppercase">Order #{o.id.slice(-6)}</span>
                          <span className="text-slate-400">|</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(o.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 font-bold border border-emerald-100/50 uppercase text-[10px]">
                            Paid
                          </span>
                          <span className={`px-2 py-0.5 rounded uppercase font-bold text-[10px] ${
                            o.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                              : o.status === 'shipped'
                              ? 'bg-blue-50 text-blue-600 border border-blue-100/50'
                              : 'bg-amber-50 text-amber-600 border border-amber-100/50'
                          }`}>
                            {o.status}
                          </span>
                        </div>
                      </div>

                      {/* Items details */}
                      <div className="space-y-3">
                        {o.items.map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 object-cover rounded-lg border border-slate-100"
                              onError={(e) => {
                                (e.target as HTMLImageElement).onerror = null;
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
                              }}
                            />
                            <div className="flex-grow min-w-0">
                              <h4 className="font-semibold text-slate-800 text-xs truncate">{item.name}</h4>
                              <p className="text-[10px] text-slate-400 font-medium">Qty {item.qty} × ${item.price.toFixed(2)}</p>
                            </div>
                            <span className="font-bold text-slate-900 text-xs">${(item.price * item.qty).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Footer total */}
                      <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                        <div className="text-slate-400">
                          <span className="font-semibold text-slate-500">Destination:</span> {o.shippingAddress.address}, {o.shippingAddress.city}
                        </div>
                        <div className="text-right">
                          <span className="text-slate-400 font-medium mr-1.5">Settled Amount:</span>
                          <span className="font-black text-slate-900">${o.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {orders.length === 0 && (
                    <div className="py-24 text-center bg-white border border-slate-200 rounded-3xl">
                      <div className="p-3.5 bg-slate-50 rounded-full w-fit mx-auto mb-3 text-slate-400">
                        <Clock className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-slate-900 text-base">No transaction logs</h3>
                      <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                        We did not find any historic checkout settlement transactions linked to your account.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* 6. ADMIN PORTAL SCREEN */}
            {currentView === 'admin' && user?.role === 'admin' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                key="admin-view"
                className="space-y-6"
              >
                {/* Admin Tab Header */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 font-display">Administrator Command Room</h2>
                    <p className="text-xs text-slate-400">Calibrate catalog parameters and ship transactions</p>
                  </div>

                  <div className="flex items-center bg-slate-100 rounded-xl p-1 shrink-0 border border-slate-200/50 self-start">
                    <button
                      onClick={() => setAdminTab('stats')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        adminTab === 'stats' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Dashboard
                    </button>
                    <button
                      onClick={() => setAdminTab('products')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        adminTab === 'products' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Catalog
                    </button>
                    <button
                      onClick={() => setAdminTab('orders')}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                        adminTab === 'orders' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Shipments
                    </button>
                  </div>
                </div>

                {/* Sub admin view toggler */}
                <div>
                  {adminTab === 'stats' && adminStats && (
                    <StatsView
                      stats={adminStats}
                      onNavigateOrder={() => setAdminTab('orders')}
                    />
                  )}

                  {adminTab === 'products' && (
                    <ProductsView
                      products={products}
                      token={token}
                      onAddProduct={handleAddProduct}
                      onUpdateProduct={handleUpdateProduct}
                      onDeleteProduct={handleDeleteProduct}
                    />
                  )}

                  {adminTab === 'orders' && (
                    <OrdersView
                      orders={orders}
                      onUpdateStatus={handleUpdateOrderStatus}
                    />
                  )}
                </div>
              </motion.div>
            )}

            {/* 7. LOGIN SCREEN */}
            {currentView === 'login' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="login-view"
                className="max-w-md mx-auto py-12"
              >
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="text-center space-y-1.5">
                    <h2 className="text-xl font-bold text-slate-900 font-display">Welcome Back</h2>
                    <p className="text-xs text-slate-400">Sign in to settle order parameters and track wishlists</p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      const emailInput = (e.target as any).elements.email.value;
                      const passwordInput = (e.target as any).elements.password.value;
                      handleLogin(e, { email: emailInput, password: passwordInput });
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-semibold">Email Address</label>
                      <input
                        name="email"
                        type="email"
                        required
                        defaultValue="customer@store.com"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                        placeholder="jane.doe@example.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-semibold">Password</label>
                      <input
                        name="password"
                        type="password"
                        required
                        defaultValue="customer123"
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Authenticate Access
                    </button>
                  </form>

                  {/* Seed Accounts info */}
                  <div className="p-3.5 bg-indigo-50 border border-indigo-100/50 rounded-2xl text-[11px] text-slate-600 leading-relaxed space-y-1.5">
                    <span className="font-bold text-indigo-700">Pre-seeded Mock Accounts:</span>
                    <div>
                      <p className="font-semibold text-slate-700">🛒 Customer Account:</p>
                      <p>Email: <span className="font-mono">customer@store.com</span> / Password: <span className="font-mono">customer123</span></p>
                    </div>
                    <div className="pt-1.5 border-t border-indigo-100/40">
                      <p className="font-semibold text-amber-700">🛡️ Admin Account:</p>
                      <p>Email: <span className="font-mono">admin@store.com</span> / Password: <span className="font-mono">admin123</span></p>
                    </div>
                  </div>

                  <p className="text-center text-xs text-slate-400">
                    Don't have an account yet?{' '}
                    <button
                      onClick={() => {
                        window.location.hash = '#/register';
                        setCurrentView('register');
                      }}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Register here
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

            {/* 8. REGISTER SCREEN */}
            {currentView === 'register' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                key="register-view"
                className="max-w-md mx-auto py-12"
              >
                <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-sm space-y-6">
                  <div className="text-center space-y-1.5">
                    <h2 className="text-xl font-bold text-slate-900 font-display">Create an Account</h2>
                    <p className="text-xs text-slate-400">Join us to access custom wishlists and coupons</p>
                  </div>

                  <form
                    onSubmit={(e) => {
                      const nameInput = (e.target as any).elements.name.value;
                      const emailInput = (e.target as any).elements.email.value;
                      const passwordInput = (e.target as any).elements.password.value;
                      handleRegister(e, { name: nameInput, email: emailInput, password: passwordInput });
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-semibold">Full Name</label>
                      <input
                        name="name"
                        type="text"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                        placeholder="Jane Doe"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-semibold">Email Address</label>
                      <input
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                        placeholder="jane.doe@example.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-500 font-semibold">Password</label>
                      <input
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm focus:bg-white"
                        placeholder="Minimum 6 characters"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      Submit Registration
                    </button>
                  </form>

                  <p className="text-center text-xs text-slate-400">
                    Already have an account?{' '}
                    <button
                      onClick={() => {
                        window.location.hash = '#/login';
                        setCurrentView('login');
                      }}
                      className="text-indigo-600 font-bold hover:underline cursor-pointer"
                    >
                      Login here
                    </button>
                  </p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        )}

      </main>

      {/* Elegant minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-[11px] font-medium text-slate-400">
            &copy; 2026 ElectroStore Applet. Settle simulated orders securely. Built with premium Vite-React modules.
          </div>
          <div className="flex space-x-6 text-[11px] font-bold text-slate-400">
            <button onClick={() => { window.location.hash = '#/'; setCurrentView('catalog'); }} className="hover:text-indigo-600 cursor-pointer">Catalog Store</button>
            <button onClick={() => { window.location.hash = '#/cart'; setCurrentView('cart'); }} className="hover:text-indigo-600 cursor-pointer">Cart</button>
            <a href="#/" className="hover:text-indigo-600">Privacy Charter</a>
            <a href="#/" className="hover:text-indigo-600">Merchant Policies</a>
          </div>
        </div>
      </footer>

    </div>
  );
}
