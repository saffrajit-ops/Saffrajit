const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const errorHandler = require('./middlewares/errorHandler');

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const adminRoutes = require('./routes/admin.routes');
const productRoutes = require('./routes/product.routes');
const reviewRoutes = require('./routes/review.routes');
const cartRoutes = require('./routes/cart.routes');
const wishlistRoutes = require('./routes/wishlist.routes');
const paymentsRoutes = require('./routes/payments.routes');
const orderRoutes = require('./routes/order.routes');
const couponRoutes = require('./routes/coupon.routes');
const blogRoutes = require('./routes/blog.routes');
const contactRoutes = require('./routes/contact.routes');
const uploadRoutes = require('./routes/upload.routes');
const heroSectionRoutes = require('./routes/heroSection.routes');
const luxuryShowcaseRoutes = require('./routes/luxuryShowcase.routes');
const companyInfoRoutes = require('./routes/companyInfo.routes');
const newsletterRoutes = require('./routes/newsletter.routes');
const commentRoutes = require('./routes/comment.routes');
const bannerRoutes = require('./routes/banner.routes');
const notificationRoutes = require('./routes/notification.routes');

const app = express();

// Security middleware with Cloudinary support
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "https://res.cloudinary.com"],
      mediaSrc: ["'self'", "https://res.cloudinary.com", "blob:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      fontSrc: ["'self'", "https:", "data:"],
    },
  },
}));

const allowedOrigins = [
  'https://saffrajit-jdyq.vercel.app',
  'https://saffrajit-9j72.vercel.app',
  'http://localhost:3000'
];

function corsOrigin(origin, callback) {
  if (!origin) return callback(null, true);
  if (allowedOrigins.includes(origin)) return callback(null, true);
  return callback(new Error('Origin not allowed by CORS'), false);
}

app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  maxAge: 600,
  optionsSuccessStatus: 204
}));

app.options(/.*/, cors({
  origin: corsOrigin,
  credentials: true
}));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Webhook FIRST with raw body (only this route)
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), require('./controllers/payments.controller').webhook);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/hero-section', heroSectionRoutes);
app.use('/api/luxury-showcase', luxuryShowcaseRoutes);
app.use('/api/company-info', companyInfoRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api', commentRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/admin/notifications', notificationRoutes);

// 404 handler - catch all unmatched routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

module.exports = app;