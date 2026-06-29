import express from 'express';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import { protect, admin, generateToken, AuthenticatedRequest } from './server/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Ensure uploads and data directories exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Parse JSON and URL-encoded bodies
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static uploads
  app.use('/uploads', express.static(uploadsDir));

  // Custom CORS headers
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // --- Auth Endpoints ---

  app.post('/api/auth/register', (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) {
        res.status(400).json({ message: 'Name, email, and password are required' });
        return;
      }

      const existingUser = db.findUserByEmail(email);
      if (existingUser) {
        res.status(400).json({ message: 'A user with this email already exists' });
        return;
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      
      // First registered user is automatically an admin to make testing easy, otherwise standard customer
      const isFirstUser = db.getUsers().length === 0;
      const role = isFirstUser ? 'admin' : 'customer';

      const user = db.createUser(name, email, passwordHash, role);
      const token = generateToken(user.id);

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/auth/login', (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ message: 'Email and password are required' });
        return;
      }

      const user = db.findUserByEmail(email);
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        res.status(401).json({ message: 'Invalid email or password' });
        return;
      }

      const token = generateToken(user.id);

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        wishlist: user.wishlist || [],
        token
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/auth/me', protect, (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authorized' });
      return;
    }
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      wishlist: req.user.wishlist || []
    });
  });

  app.post('/api/auth/wishlist', protect, (req: AuthenticatedRequest, res) => {
    try {
      const { productId } = req.body;
      if (!productId) {
        res.status(400).json({ message: 'Product ID is required' });
        return;
      }
      if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
      }
      const updatedWishlist = db.toggleWishlist(req.user.id, productId);
      res.json(updatedWishlist);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });


  // --- Product Endpoints ---

  app.get('/api/products', (req, res) => {
    try {
      const { search, category, sort } = req.query;
      let products = db.getProducts();

      if (search) {
        const query = String(search).toLowerCase();
        products = products.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.description.toLowerCase().includes(query)
        );
      }

      if (category && category !== 'All') {
        products = products.filter(p => p.category === category);
      }

      if (sort === 'priceAsc') {
        products = [...products].sort((a, b) => a.price - b.price);
      } else if (sort === 'priceDesc') {
        products = [...products].sort((a, b) => b.price - a.price);
      } else if (sort === 'rating') {
        products = [...products].sort((a, b) => b.rating - a.rating);
      } else {
        // Default newest
        products = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      }

      res.json(products);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/products/:id', (req, res) => {
    try {
      const product = db.findProductById(req.params.id);
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      res.json(product);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/products', protect, admin, (req, res) => {
    try {
      const { name, price, description, category, stock, image } = req.body;
      if (!name || price === undefined || !description || !category || stock === undefined) {
        res.status(400).json({ message: 'All fields (name, price, description, category, stock) are required' });
        return;
      }

      const product = db.createProduct({
        name,
        price: parseFloat(price),
        description,
        category,
        stock: parseInt(stock),
        image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
      });

      res.status(201).json(product);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put('/api/products/:id', protect, admin, (req, res) => {
    try {
      const { name, price, description, category, stock, image } = req.body;
      
      const product = db.findProductById(req.params.id);
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      const updated = db.updateProduct(req.params.id, {
        ...(name && { name }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(description && { description }),
        ...(category && { category }),
        ...(stock !== undefined && { stock: parseInt(stock) }),
        ...(image !== undefined && { image })
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.delete('/api/products/:id', protect, admin, (req, res) => {
    try {
      const success = db.deleteProduct(req.params.id);
      if (!success) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }
      res.json({ message: 'Product deleted successfully' });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post('/api/products/:id/review', protect, (req: AuthenticatedRequest, res) => {
    try {
      const { rating, comment } = req.body;
      if (!rating || !comment) {
        res.status(400).json({ message: 'Rating and comment are required' });
        return;
      }
      if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
      }

      const product = db.addReview(req.params.id, req.user.name, parseInt(rating), comment);
      if (!product) {
        res.status(404).json({ message: 'Product not found' });
        return;
      }

      res.status(201).json(product);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });


  // --- Multer Image Upload ---

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
    }
  });

  const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
      const allowedExts = /jpeg|jpg|png|webp|gif/;
      const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedExts.test(file.mimetype);

      if (extname && mimetype) {
        cb(null, true);
      } else {
        cb(new Error('Only standard images (.png, .jpg, .jpeg, .webp, .gif) are allowed'));
      }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  app.post('/api/products/upload', protect, admin, upload.single('image'), (req, res) => {
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded or file type is invalid' });
      return;
    }
    const relativeUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl: relativeUrl });
  });


  // --- Order Endpoints ---

  app.post('/api/orders', protect, (req: AuthenticatedRequest, res) => {
    try {
      const { items, shippingAddress, couponCode } = req.body;
      if (!items || !items.length || !shippingAddress) {
        res.status(400).json({ message: 'Order items and shipping address are required' });
        return;
      }
      if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
      }

      // Check stock availability
      for (const item of items) {
        const product = db.findProductById(item.productId);
        if (!product) {
          res.status(404).json({ message: `Product ${item.name} not found` });
          return;
        }
        if (product.stock < item.qty) {
          res.status(400).json({ message: `Insufficient stock for product: ${product.name}` });
          return;
        }
      }

      const order = db.createOrder(req.user.id, items, shippingAddress, couponCode);
      res.status(201).json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/orders/my-orders', protect, (req: AuthenticatedRequest, res) => {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authorized' });
        return;
      }
      const orders = db.findOrdersByUserId(req.user.id);
      res.json(orders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.get('/api/orders', protect, admin, (req, res) => {
    try {
      const orders = db.getOrders();
      // Populate basic user info
      const populatedOrders = orders.map(o => {
        const u = db.findUserById(o.userId);
        return {
          ...o,
          user: u ? { id: u.id, name: u.name, email: u.email } : null
        };
      });
      res.json(populatedOrders);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put('/api/orders/:id/status', protect, admin, (req, res) => {
    try {
      const { status } = req.body;
      if (!status || !['pending', 'shipped', 'delivered'].includes(status)) {
        res.status(400).json({ message: 'Invalid or missing status' });
        return;
      }

      const order = db.updateOrderStatus(req.params.id, status as any);
      if (!order) {
        res.status(404).json({ message: 'Order not found' });
        return;
      }

      res.json(order);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });


  // --- Coupons ---

  app.get('/api/coupons/validate', (req, res) => {
    try {
      const code = req.query.code;
      if (!code) {
        res.status(400).json({ message: 'Coupon code is required' });
        return;
      }

      const coupon = db.findCoupon(String(code));
      if (!coupon) {
        res.status(404).json({ message: 'Coupon code is invalid or expired' });
        return;
      }

      res.json({
        code: coupon.code,
        discountPercent: coupon.discountPercent
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });


  // --- Admin Dashboard Statistics ---

  app.get('/api/admin/stats', protect, admin, (req, res) => {
    try {
      const orders = db.getOrders();
      const products = db.getProducts();
      const users = db.getUsers();

      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, o) => sum + o.totalPrice, 0);
      const totalProducts = products.length;
      const totalCustomers = users.filter(u => u.role === 'customer').length;

      // Group product count by category
      const categoryCounts: Record<string, number> = {};
      products.forEach(p => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      });

      // Sales progress over past order items (or recent activity)
      const recentOrders = orders.slice(0, 5).map(o => {
        const u = db.findUserById(o.userId);
        return {
          id: o.id,
          customerName: u ? u.name : 'Unknown User',
          totalPrice: o.totalPrice,
          status: o.status,
          createdAt: o.createdAt
        };
      });

      res.json({
        totalRevenue,
        totalOrders,
        totalProducts,
        totalCustomers,
        categoryCounts,
        recentOrders
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });


  // --- Vite & Client App Serving ---

  if (process.env.DISABLE_HMR === 'true') {
    // Serving built production files from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      // Don't intercept API routes
      if (req.path.startsWith('/api/')) return next();
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Dev Server via Vite middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  // General error handling
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express unexpected error:', err);
    res.status(500).json({ message: 'Internal server error occurred', error: err.message });
  });

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend server successfully running on host 0.0.0.0, port ${PORT}`);
  });
}

startServer();
