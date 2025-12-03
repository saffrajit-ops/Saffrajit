const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../src/models/user.model');
const Order = require('../src/models/order.model');
const Product = require('../src/models/product.model');

/**
 * Verification script to check migrated data
 */

async function verifyMigration() {
  try {
    console.log('🔍 Verifying Migration Data\n');
    console.log('=' .repeat(60) + '\n');
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Count migrated users (those with WP- prefix in orders)
    const migratedOrders = await Order.find({ orderNumber: /^WP-/ });
    const migratedUserIds = new Set(migratedOrders.map(o => o.user.toString()));
    
    console.log('📊 Migration Statistics:');
    console.log(`   - Migrated Users: ${migratedUserIds.size}`);
    console.log(`   - Migrated Orders: ${migratedOrders.length}`);
    console.log(`   - Total Users in DB: ${await User.countDocuments()}`);
    console.log(`   - Total Orders in DB: ${await Order.countDocuments()}`);
    console.log(`   - Total Products in DB: ${await Product.countDocuments()}\n`);
    
    // Order status breakdown
    const statusCounts = {};
    migratedOrders.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });
    
    console.log('📊 Migrated Order Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count}`);
    });
    console.log();
    
    // Calculate total revenue from migrated orders
    const totalRevenue = migratedOrders.reduce((sum, order) => sum + order.total, 0);
    const paidOrders = migratedOrders.filter(o => o.payment.status === 'completed');
    const paidRevenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
    
    console.log('💰 Revenue Statistics:');
    console.log(`   - Total Revenue (all orders): $${totalRevenue.toFixed(2)}`);
    console.log(`   - Paid Revenue: $${paidRevenue.toFixed(2)}`);
    console.log(`   - Paid Orders: ${paidOrders.length}`);
    console.log(`   - Average Order Value: $${(totalRevenue / migratedOrders.length).toFixed(2)}\n`);
    
    // Sample migrated user
    const sampleUser = await User.findOne({ 
      _id: { $in: Array.from(migratedUserIds) } 
    });
    
    if (sampleUser) {
      console.log('👤 Sample Migrated User:');
      console.log(`   - Email: ${sampleUser.email}`);
      console.log(`   - Name: ${sampleUser.name}`);
      console.log(`   - Role: ${sampleUser.role}`);
      console.log(`   - Addresses: ${sampleUser.addresses.length}`);
      console.log(`   - Created: ${sampleUser.createdAt}\n`);
    }
    
    // Sample migrated order
    const sampleOrder = migratedOrders[0];
    if (sampleOrder) {
      console.log('📦 Sample Migrated Order:');
      console.log(`   - Order Number: ${sampleOrder.orderNumber}`);
      console.log(`   - Status: ${sampleOrder.status}`);
      console.log(`   - Total: $${sampleOrder.total}`);
      console.log(`   - Items: ${sampleOrder.items.length}`);
      console.log(`   - Payment Status: ${sampleOrder.payment.status}`);
      console.log(`   - Created: ${sampleOrder.createdAt}\n`);
    }
    
    // Check for orders with coupons
    const ordersWithCoupons = migratedOrders.filter(o => o.coupon && o.coupon.code);
    console.log(`🎟️  Orders with Coupons: ${ordersWithCoupons.length}`);
    
    if (ordersWithCoupons.length > 0) {
      console.log('   Sample Coupon:');
      const sampleCoupon = ordersWithCoupons[0].coupon;
      console.log(`   - Code: ${sampleCoupon.code}`);
      console.log(`   - Type: ${sampleCoupon.type}`);
      console.log(`   - Discount: $${sampleCoupon.discount}\n`);
    }
    
    // Check for incomplete data
    const ordersWithoutAddress = migratedOrders.filter(o => !o.shippingAddress || !o.shippingAddress.line1);
    console.log(`⚠️  Orders without shipping address: ${ordersWithoutAddress.length}`);
    
    const usersWithoutAddress = await User.countDocuments({ 
      _id: { $in: Array.from(migratedUserIds) },
      'addresses.0': { $exists: false }
    });
    console.log(`⚠️  Users without address: ${usersWithoutAddress}\n`);
    
    console.log('✅ Verification complete!\n');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run verification
if (require.main === module) {
  verifyMigration()
    .then(() => {
      console.log('\n✅ Verification completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Verification failed:', error);
      process.exit(1);
    });
}

module.exports = { verifyMigration };
