require('dotenv').config();
const fs = require('fs');
const path = require('path');

/**
 * Test script to analyze WordPress data structure before migration
 * This helps understand the data and validate the migration approach
 */

console.log('=== WordPress Data Analysis ===\n');

// Load WordPress data files
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

// Extract actual data arrays (skip metadata rows)
const users = wpUsers.find(item => item.type === 'table')?.data || [];
const customers = wpCustomers.find(item => item.type === 'table')?.data || [];
const orderStats = wpOrderStats.find(item => item.type === 'table')?.data || [];
const orderProducts = wpOrderProducts.find(item => item.type === 'table')?.data || [];
const orderCoupons = wpOrderCoupons.find(item => item.type === 'table')?.data || [];

console.log('📊 Data Counts:');
console.log(`- Users: ${users.length}`);
console.log(`- Customers: ${customers.length}`);
console.log(`- Orders: ${orderStats.length}`);
console.log(`- Order Products: ${orderProducts.length}`);
console.log(`- Order Coupons: ${orderCoupons.length}\n`);

// Find customers with orders
const customerIdsWithOrders = new Set(orderStats.map(order => order.customer_id));
console.log(`👥 Customers with orders: ${customerIdsWithOrders.size}\n`);

// Sample data analysis
console.log('📋 Sample User:');
console.log(JSON.stringify(users[0], null, 2));

console.log('\n📋 Sample Customer:');
console.log(JSON.stringify(customers[0], null, 2));

console.log('\n📋 Sample Order:');
console.log(JSON.stringify(orderStats[0], null, 2));

console.log('\n📋 Sample Order Product:');
console.log(JSON.stringify(orderProducts[0], null, 2));

if (orderCoupons.length > 0) {
  console.log('\n📋 Sample Order Coupon:');
  console.log(JSON.stringify(orderCoupons[0], null, 2));
}

// Analyze order statuses
const statusCounts = {};
orderStats.forEach(order => {
  statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
});

console.log('\n📊 Order Status Distribution:');
Object.entries(statusCounts).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`);
});

// Find unique product IDs
const uniqueProducts = new Set(orderProducts.map(op => op.product_id));
console.log(`\n🛍️ Unique products in orders: ${uniqueProducts.size}`);

console.log('\n✅ Data analysis complete!');
