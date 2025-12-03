const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const bcrypt = require('bcrypt');

// Import models
const User = require('../src/models/user.model');
const Order = require('../src/models/order.model');
const Product = require('../src/models/product.model');

/**
 * WordPress to Next.js Data Migration Script
 * 
 * This script migrates:
 * 1. Users (only those with orders)
 * 2. Orders with their products
 * 3. Coupon information embedded in orders
 * 
 * Requirements:
 * - Only migrate users who have placed orders
 * - Map WordPress order statuses to new system
 * - Handle product references (products must exist in new system)
 */

// Status mapping from WordPress to new system
const STATUS_MAP = {
  'wc-processing': 'processing',
  'wc-completed': 'delivered',
  'wc-cancelled': 'cancelled',
  'wc-refunded': 'refunded',
  'wc-on-hold': 'pending',
  'wc-failed': 'failed',
  'wc-pending': 'pending'
};

// Load WordPress data
function loadWordPressData() {
  console.log('📂 Loading WordPress data files...\n');
  
  const wpUsers = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/users/wpuf_users.json'), 'utf8')
  );
  
  const wpCustomers = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/users/wpuf_wc_customer_lookup.json'), 'utf8')
  );
  
  const wpOrderStats = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/orders/wpuf_wc_order_stats.json'), 'utf8')
  );
  
  const wpOrderProducts = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/orders/wpuf_wc_order_product_lookup.json'), 'utf8')
  );
  
  const wpOrderCoupons = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../database/orders/wpuf_wc_order_coupon_lookup.json'), 'utf8')
  );
  
  return {
    users: wpUsers.find(item => item.type === 'table')?.data || [],
    customers: wpCustomers.find(item => item.type === 'table')?.data || [],
    orderStats: wpOrderStats.find(item => item.type === 'table')?.data || [],
    orderProducts: wpOrderProducts.find(item => item.type === 'table')?.data || [],
    orderCoupons: wpOrderCoupons.find(item => item.type === 'table')?.data || []
  };
}

// Get customers with orders
function getCustomersWithOrders(orderStats) {
  const customerIds = new Set(orderStats.map(order => order.customer_id));
  return customerIds;
}

// Map customer data to user model
async function mapCustomerToUser(customer, wpUser) {
  const email = customer.email.toLowerCase().trim();
  
  // Generate a random password hash (users will need to reset password)
  const randomPassword = Math.random().toString(36).slice(-12);
  const passwordHash = await bcrypt.hash(randomPassword, 12);
  
  const userData = {
    email: email,
    passwordHash: passwordHash,
    name: `${customer.first_name || ''} ${customer.last_name || ''}`.trim() || customer.username || 'User',
    phone: '',
    role: 'user',
    isActive: true,
    isEmailVerified: false,
    addresses: []
  };
  
  // Add address if available (only if we have complete data)
  if (customer.country && customer.city && customer.postcode && customer.state) {
    userData.addresses.push({
      label: 'Home',
      line1: 'Address not provided',
      line2: '',
      city: customer.city,
      state: customer.state,
      zip: customer.postcode,
      country: customer.country,
      isDefault: true
    });
  }
  
  return userData;
}

// Map order products
async function mapOrderProducts(orderId, orderProducts, productMap) {
  const items = [];
  const orderItems = orderProducts.filter(op => op.order_id === orderId);
  
  for (const item of orderItems) {
    const productId = item.product_id;
    const product = productMap.get(productId);
    
    if (!product) {
      console.log(`  ⚠️  Product ${productId} not found in database, skipping...`);
      continue;
    }
    
    items.push({
      product: product._id,
      title: product.title,
      price: parseFloat(item.product_gross_revenue) / parseInt(item.product_qty),
      quantity: parseInt(item.product_qty),
      subtotal: parseFloat(item.product_gross_revenue)
    });
  }
  
  return items;
}

// Map order data
async function mapOrder(wpOrder, orderProducts, orderCoupons, userMap, productMap, customerMap) {
  const customerId = wpOrder.customer_id;
  const customer = customerMap.get(customerId);
  
  if (!customer) {
    console.log(`  ⚠️  Customer ${customerId} not found, skipping order ${wpOrder.order_id}`);
    return null;
  }
  
  const user = userMap.get(customer.email.toLowerCase());
  
  if (!user) {
    console.log(`  ⚠️  User for customer ${customerId} not found, skipping order ${wpOrder.order_id}`);
    return null;
  }
  
  // Map order items
  const items = await mapOrderProducts(wpOrder.order_id, orderProducts, productMap);
  
  if (items.length === 0) {
    console.log(`  ⚠️  No valid products for order ${wpOrder.order_id}, skipping...`);
    return null;
  }
  
  // Calculate totals
  const subtotal = parseFloat(wpOrder.net_total);
  const shippingCharges = parseFloat(wpOrder.shipping_total) || 0;
  const total = parseFloat(wpOrder.total_sales);
  
  // Map status
  const status = STATUS_MAP[wpOrder.status] || 'pending';
  
  // Check for coupon
  const orderCoupon = orderCoupons.find(oc => oc.order_id === wpOrder.order_id);
  let couponData = null;
  
  if (orderCoupon) {
    couponData = {
      code: `WP-COUPON-${orderCoupon.coupon_id}`,
      type: 'flat',
      value: parseFloat(orderCoupon.discount_amount),
      discount: parseFloat(orderCoupon.discount_amount)
    };
  }
  
  // Payment status
  const isPaid = wpOrder.date_paid && wpOrder.date_paid !== '0000-00-00 00:00:00' && wpOrder.date_paid !== '1969-12-31 17:00:00';
  
  const orderData = {
    user: user._id,
    orderNumber: `WP-${wpOrder.order_id}`,
    items: items,
    currency: 'usd',
    subtotal: subtotal,
    discount: 0,
    shippingCharges: shippingCharges,
    total: total,
    coupon: couponData,
    payment: {
      method: 'stripe', // Assume stripe for old orders
      status: isPaid ? 'completed' : 'pending',
      paidAt: isPaid ? new Date(wpOrder.date_paid) : null
    },
    status: status,
    createdAt: new Date(wpOrder.date_created),
    updatedAt: new Date(wpOrder.date_created)
  };
  
  // Add shipping address if available (only if we have complete data)
  if (customer.country && customer.city && customer.postcode && customer.state) {
    orderData.shippingAddress = {
      label: 'Home',
      line1: 'Address not provided',
      line2: '',
      city: customer.city,
      state: customer.state,
      zip: customer.postcode,
      country: customer.country
    };
  }
  
  // Set status-specific dates
  if (status === 'delivered' && wpOrder.date_completed && wpOrder.date_completed !== '0000-00-00 00:00:00') {
    orderData.delivery = {
      deliveredAt: new Date(wpOrder.date_completed)
    };
  }
  
  if (status === 'cancelled') {
    orderData.cancellation = {
      reason: 'Migrated from WordPress',
      cancelledAt: new Date(wpOrder.date_created)
    };
  }
  
  return orderData;
}

// Main migration function
async function migrateData() {
  try {
    console.log('🚀 Starting WordPress to Next.js Data Migration\n');
    console.log('=' .repeat(60) + '\n');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Load WordPress data
    const wpData = loadWordPressData();
    console.log('✅ WordPress data loaded');
    console.log(`   - Users: ${wpData.users.length}`);
    console.log(`   - Customers: ${wpData.customers.length}`);
    console.log(`   - Orders: ${wpData.orderStats.length}`);
    console.log(`   - Order Products: ${wpData.orderProducts.length}`);
    console.log(`   - Order Coupons: ${wpData.orderCoupons.length}\n`);
    
    // Get customers with orders
    const customerIdsWithOrders = getCustomersWithOrders(wpData.orderStats);
    const customersWithOrders = wpData.customers.filter(c => customerIdsWithOrders.has(c.customer_id));
    
    console.log(`👥 Customers with orders: ${customersWithOrders.length}\n`);
    
    // Create customer map
    const customerMap = new Map();
    customersWithOrders.forEach(c => customerMap.set(c.customer_id, c));
    
    // Step 1: Migrate Users
    console.log('=' .repeat(60));
    console.log('STEP 1: Migrating Users');
    console.log('=' .repeat(60) + '\n');
    
    const userMap = new Map();
    let usersCreated = 0;
    let usersSkipped = 0;
    
    for (const customer of customersWithOrders) {
      try {
        const email = customer.email.toLowerCase().trim();
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        
        if (existingUser) {
          console.log(`⏭️  User ${email} already exists, skipping...`);
          userMap.set(email, existingUser);
          usersSkipped++;
          continue;
        }
        
        // Find corresponding WordPress user
        const wpUser = wpData.users.find(u => u.user_email.toLowerCase() === email);
        
        // Create user
        const userData = await mapCustomerToUser(customer, wpUser);
        const user = await User.create(userData);
        
        userMap.set(email, user);
        usersCreated++;
        console.log(`✅ Created user: ${email}`);
        
      } catch (error) {
        console.error(`❌ Error creating user ${customer.email}:`, error.message);
        usersSkipped++;
      }
    }
    
    console.log(`\n📊 User Migration Summary:`);
    console.log(`   - Created: ${usersCreated}`);
    console.log(`   - Skipped: ${usersSkipped}`);
    console.log(`   - Total: ${usersCreated + usersSkipped}\n`);
    
    // Step 2: Load existing products
    console.log('=' .repeat(60));
    console.log('STEP 2: Loading Existing Products');
    console.log('=' .repeat(60) + '\n');
    
    const products = await Product.find({});
    const productMap = new Map();
    
    // Map by product_id (if available) or by ID
    products.forEach(p => {
      if (p.product_id) {
        productMap.set(p.product_id, p);
      }
      // Also try mapping by MongoDB _id as string
      productMap.set(p._id.toString(), p);
    });
    
    console.log(`✅ Loaded ${products.length} products from database\n`);
    
    // Get unique product IDs from orders
    const uniqueProductIds = new Set(wpData.orderProducts.map(op => op.product_id));
    console.log(`📦 Unique products in orders: ${uniqueProductIds.size}`);
    
    // Check which products are missing
    const missingProducts = [];
    uniqueProductIds.forEach(pid => {
      if (!productMap.has(pid)) {
        missingProducts.push(pid);
      }
    });
    
    if (missingProducts.length > 0) {
      console.log(`⚠️  Warning: ${missingProducts.length} products not found in database:`);
      console.log(`   Product IDs: ${missingProducts.join(', ')}`);
      console.log(`   Orders with these products will be skipped or have incomplete items\n`);
    } else {
      console.log(`✅ All products found in database\n`);
    }
    
    // Step 3: Migrate Orders
    console.log('=' .repeat(60));
    console.log('STEP 3: Migrating Orders');
    console.log('=' .repeat(60) + '\n');
    
    let ordersCreated = 0;
    let ordersSkipped = 0;
    
    for (const wpOrder of wpData.orderStats) {
      try {
        // Skip refund orders (parent_id > 0)
        if (wpOrder.parent_id !== '0') {
          console.log(`⏭️  Skipping refund order ${wpOrder.order_id}`);
          ordersSkipped++;
          continue;
        }
        
        // Check if order already exists
        const existingOrder = await Order.findOne({ orderNumber: `WP-${wpOrder.order_id}` });
        
        if (existingOrder) {
          console.log(`⏭️  Order WP-${wpOrder.order_id} already exists, skipping...`);
          ordersSkipped++;
          continue;
        }
        
        // Map order
        const orderData = await mapOrder(
          wpOrder,
          wpData.orderProducts,
          wpData.orderCoupons,
          userMap,
          productMap,
          customerMap
        );
        
        if (!orderData) {
          ordersSkipped++;
          continue;
        }
        
        // Create order
        const order = await Order.create(orderData);
        ordersCreated++;
        console.log(`✅ Created order: WP-${wpOrder.order_id} (${orderData.status}) - $${orderData.total}`);
        
      } catch (error) {
        console.error(`❌ Error creating order ${wpOrder.order_id}:`, error.message);
        ordersSkipped++;
      }
    }
    
    console.log(`\n📊 Order Migration Summary:`);
    console.log(`   - Created: ${ordersCreated}`);
    console.log(`   - Skipped: ${ordersSkipped}`);
    console.log(`   - Total: ${ordersCreated + ordersSkipped}\n`);
    
    // Final Summary
    console.log('=' .repeat(60));
    console.log('MIGRATION COMPLETE');
    console.log('=' .repeat(60) + '\n');
    
    console.log('📊 Final Summary:');
    console.log(`   Users Created: ${usersCreated}`);
    console.log(`   Orders Created: ${ordersCreated}`);
    console.log(`   Products Referenced: ${uniqueProductIds.size}`);
    console.log(`   Missing Products: ${missingProducts.length}\n`);
    
    console.log('✅ Migration completed successfully!\n');
    
    console.log('📝 Next Steps:');
    console.log('   1. Verify migrated data in your database');
    console.log('   2. Users will need to reset their passwords');
    console.log('   3. Review orders with missing products');
    console.log('   4. Update product references if needed\n');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run migration
if (require.main === module) {
  migrateData()
    .then(() => {
      console.log('\n✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateData };
