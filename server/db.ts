import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'customer' | 'admin';
  wishlist: string[];
  createdAt: string;
}

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

export interface OrderItem {
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
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  totalPrice: number;
  isPaid: boolean;
  paidAt?: string;
  status: 'pending' | 'shipped' | 'delivered';
  couponCode?: string;
  discountAmount: number;
  createdAt: string;
}

export interface Coupon {
  code: string;
  discountPercent: number;
  active: boolean;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

class Database {
  private users: User[] = [];
  private products: Product[] = [];
  private orders: Order[] = [];
  private coupons: Coupon[] = [];

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        this.users = data.users || [];
        this.products = data.products || [];
        this.orders = data.orders || [];
        this.coupons = data.coupons || [];
      } catch (err) {
        console.error('Error reading DB, reinitializing with defaults...', err);
        this.seedDefaults();
      }
    } else {
      this.seedDefaults();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify({
        users: this.users,
        products: this.products,
        orders: this.orders,
        coupons: this.coupons,
      }, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing to DB file', err);
    }
  }

  private seedDefaults() {
    // Default Admin (password: admin123)
    this.users = [
      {
        id: 'user_admin_1',
        name: 'Store Admin',
        email: 'admin@store.com',
        passwordHash: bcrypt.hashSync('admin123', 10),
        role: 'admin',
        wishlist: [],
        createdAt: new Date().toISOString(),
      },
      {
        id: 'user_customer_1',
        name: 'Jane Doe',
        email: 'customer@store.com',
        passwordHash: bcrypt.hashSync('customer123', 10),
        role: 'customer',
        wishlist: [],
        createdAt: new Date().toISOString(),
      }
    ];

    // Seeding products with high quality unsplash images
    this.products = [
      {
        id: 'prod_1',
        name: 'Over-Ear ANC Headset',
        price: 249.99,
        description: 'Immersive sound experience with advanced active noise-canceling, 40-hour long-lasting battery life, and plush leather earcups.',
        category: 'Electronics',
        stock: 12,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80',
        reviews: [
          {
            id: 'rev_1',
            name: 'Robert Miller',
            rating: 5,
            comment: 'Absolutely stunning active noise canceling! Deep rich bass, very comfortable for long hours.',
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'rev_2',
            name: 'Sarah Chen',
            rating: 4,
            comment: 'Battery life is outstanding. Sound is crisp, slightly heavier than expected but very high quality.',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        rating: 4.5,
        numReviews: 2,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_2',
        name: 'Pro Mechanical Keyboard',
        price: 129.99,
        description: 'Tenkeyless layout with premium linear red switches, hot-swappable keycaps, and customizable dynamic RGB lighting.',
        category: 'Electronics',
        stock: 8,
        image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=600&q=80',
        reviews: [],
        rating: 0,
        numReviews: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_3',
        name: 'Signature Smartwatch v2',
        price: 199.99,
        description: 'Continuous heart-rate tracking, customizable dynamic widget dial faces, built-in GPS, and seamless iOS/Android notification mirroring.',
        category: 'Wearables',
        stock: 15,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80',
        reviews: [
          {
            id: 'rev_3',
            name: 'David Hunt',
            rating: 5,
            comment: 'The GPS tracker is very precise. Dial faces are clean and easy to customize!',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        rating: 5.0,
        numReviews: 1,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_4',
        name: 'Ergonomic Wireless Mouse',
        price: 79.99,
        description: 'Precision tracking sensor, hyper-fast scroll wheel, customizable thumb buttons, and ergonomic grip supporting natural wrist posture.',
        category: 'Accessories',
        stock: 25,
        image: 'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=600&q=80',
        reviews: [],
        rating: 0,
        numReviews: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_5',
        name: 'Ultra-Wide Curved Display',
        price: 449.99,
        description: '34-inch panoramic curved monitor featuring 144Hz refresh rate, HDR10 visual accuracy, and dual-source split view capabilities.',
        category: 'Electronics',
        stock: 5,
        image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=600&q=80',
        reviews: [],
        rating: 0,
        numReviews: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_6',
        name: 'Compact Power Delivery Bank',
        price: 49.99,
        description: '20,000mAh capacity pocket charger with dual high-speed USB-C ports and ultra-rugged casing.',
        category: 'Accessories',
        stock: 30,
        image: 'https://images.unsplash.com/photo-1609592424085-f5b1287950ff?auto=format&fit=crop&w=600&q=80',
        reviews: [],
        rating: 0,
        numReviews: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_7',
        name: 'Minimalist Commuter Pack',
        price: 89.99,
        description: 'Weatherproof outer shield with dynamic organizational pockets, dedicated shockproof notebook sleeve, and hidden travel passport slot.',
        category: 'Accessories',
        stock: 14,
        image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=600&q=80',
        reviews: [],
        rating: 0,
        numReviews: 0,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'prod_8',
        name: 'Pro Wireless Lavalier Mic',
        price: 159.99,
        description: 'Dual-transmitter setup with real-time crystal clear audio processing, charging case, and universal phone compatibility.',
        category: 'Mobiles',
        stock: 10,
        image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?auto=format&fit=crop&w=600&q=80',
        reviews: [],
        rating: 0,
        numReviews: 0,
        createdAt: new Date().toISOString(),
      }
    ];

    // Seed coupons
    this.coupons = [
      { code: 'SAVE10', discountPercent: 10, active: true },
      { code: 'SUPER30', discountPercent: 30, active: true },
      { code: 'WELCOME50', discountPercent: 50, active: true }
    ];

    this.orders = [];
    this.save();
  }

  // --- User Operations ---
  public getUsers(): User[] {
    return this.users;
  }

  public findUserById(id: string): User | undefined {
    return this.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(name: string, email: string, passwordHash: string, role: 'customer' | 'admin' = 'customer'): User {
    const newUser: User = {
      id: 'user_' + Math.random().toString(36).substr(2, 9),
      name,
      email,
      passwordHash,
      role,
      wishlist: [],
      createdAt: new Date().toISOString()
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  public toggleWishlist(userId: string, productId: string): string[] {
    const user = this.findUserById(userId);
    if (!user) return [];
    if (!user.wishlist) user.wishlist = [];
    
    const index = user.wishlist.indexOf(productId);
    if (index > -1) {
      user.wishlist.splice(index, 1);
    } else {
      user.wishlist.push(productId);
    }
    this.save();
    return user.wishlist;
  }

  // --- Product Operations ---
  public getProducts(): Product[] {
    return this.products;
  }

  public findProductById(id: string): Product | undefined {
    return this.products.find(p => p.id === id);
  }

  public createProduct(p: Omit<Product, 'id' | 'reviews' | 'rating' | 'numReviews' | 'createdAt'>): Product {
    const newProduct: Product = {
      ...p,
      id: 'prod_' + Math.random().toString(36).substr(2, 9),
      reviews: [],
      rating: 0,
      numReviews: 0,
      createdAt: new Date().toISOString()
    };
    this.products.push(newProduct);
    this.save();
    return newProduct;
  }

  public updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Product | undefined {
    const productIndex = this.products.findIndex(p => p.id === id);
    if (productIndex === -1) return undefined;

    this.products[productIndex] = {
      ...this.products[productIndex],
      ...updates
    };
    this.save();
    return this.products[productIndex];
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.products.length;
    this.products = this.products.filter(p => p.id !== id);
    if (this.products.length < initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public addReview(productId: string, name: string, rating: number, comment: string): Product | undefined {
    const product = this.findProductById(productId);
    if (!product) return undefined;

    const newReview: Review = {
      id: 'rev_' + Math.random().toString(36).substr(2, 9),
      name,
      rating,
      comment,
      createdAt: new Date().toISOString()
    };

    product.reviews.push(newReview);
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, rev) => acc + rev.rating, 0) / product.numReviews;
    
    this.save();
    return product;
  }

  // --- Order Operations ---
  public getOrders(): Order[] {
    return this.orders;
  }

  public findOrderById(id: string): Order | undefined {
    return this.orders.find(o => o.id === id);
  }

  public findOrdersByUserId(userId: string): Order[] {
    return this.orders.filter(o => o.userId === userId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  }

  public createOrder(userId: string, items: OrderItem[], shippingAddress: ShippingAddress, couponCode?: string): Order {
    let discountAmount = 0;
    let itemsTotal = items.reduce((acc, item) => acc + (item.price * item.qty), 0);
    
    if (couponCode) {
      const coupon = this.findCoupon(couponCode);
      if (coupon) {
        discountAmount = parseFloat(((itemsTotal * coupon.discountPercent) / 100).toFixed(2));
      }
    }

    const totalPrice = parseFloat((itemsTotal - discountAmount).toFixed(2));

    const newOrder: Order = {
      id: 'ord_' + Math.random().toString(36).substr(2, 9),
      userId,
      items,
      shippingAddress,
      totalPrice,
      isPaid: true, // Auto-paid for mock checkout
      paidAt: new Date().toISOString(),
      status: 'pending',
      couponCode,
      discountAmount,
      createdAt: new Date().toISOString()
    };

    // Decrement stocks
    items.forEach(item => {
      const product = this.findProductById(item.productId);
      if (product) {
        product.stock = Math.max(0, product.stock - item.qty);
      }
    });

    this.orders.push(newOrder);
    this.save();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: 'pending' | 'shipped' | 'delivered'): Order | undefined {
    const order = this.findOrderById(orderId);
    if (!order) return undefined;
    order.status = status;
    this.save();
    return order;
  }

  // --- Coupon Operations ---
  public getCoupons(): Coupon[] {
    return this.coupons;
  }

  public findCoupon(code: string): Coupon | undefined {
    return this.coupons.find(c => c.code.toUpperCase() === code.toUpperCase() && c.active);
  }

  public createCoupon(code: string, discountPercent: number): Coupon {
    const newCoupon: Coupon = {
      code: code.toUpperCase(),
      discountPercent,
      active: true
    };
    this.coupons.push(newCoupon);
    this.save();
    return newCoupon;
  }
}

export const db = new Database();
