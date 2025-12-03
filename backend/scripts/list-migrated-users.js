const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');

const User = require('../src/models/user.model');
const Order = require('../src/models/order.model');

/**
 * List all migrated users with their order counts
 */

async function listMigratedUsers() {
  try {
    console.log('📋 Listing Migrated Users\n');
    console.log('=' .repeat(80) + '\n');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Get all migrated orders
    const migratedOrders = await Order.find({ orderNumber: /^WP-/ }).populate('user');
    
    // Group orders by user
    const userOrderMap = new Map();
    
    migratedOrders.forEach(order => {
      if (order.user) {
        const userId = order.user._id.toString();
        if (!userOrderMap.has(userId)) {
          userOrderMap.set(userId, {
            user: order.user,
            orders: [],
            totalSpent: 0,
            paidAmount: 0
          });
        }
        const userData = userOrderMap.get(userId);
        userData.orders.push(order);
        userData.totalSpent += order.total;
        if (order.payment.status === 'completed') {
          userData.paidAmount += order.total;
        }
      }
    });
    
    // Sort by total spent
    const sortedUsers = Array.from(userOrderMap.values()).sort((a, b) => b.totalSpent - a.totalSpent);
    
    console.log(`Total Migrated Users: ${sortedUsers.length}\n`);
    console.log('Top Customers by Total Spent:\n');
    console.log('-'.repeat(80));
    console.log(
      'Email'.padEnd(35) + 
      'Name'.padEnd(20) + 
      'Orders'.padEnd(10) + 
      'Total Spent'.padEnd(15)
    );
    console.log('-'.repeat(80));
    
    sortedUsers.slice(0, 20).forEach((userData, index) => {
      console.log(
        `${(index + 1).toString().padStart(2)}. ${userData.user.email.padEnd(32)} ` +
        `${userData.user.name.substring(0, 18).padEnd(20)} ` +
        `${userData.orders.length.toString().padEnd(10)} ` +
        `$${userData.totalSpent.toFixed(2)}`
      );
    });
    
    console.log('-'.repeat(80));
    console.log(`\nShowing top 20 of ${sortedUsers.length} users\n`);
    
    // Statistics
    const totalOrders = migratedOrders.length;
    const totalRevenue = sortedUsers.reduce((sum, u) => sum + u.totalSpent, 0);
    const avgOrdersPerUser = totalOrders / sortedUsers.length;
    const avgSpentPerUser = totalRevenue / sortedUsers.length;
    
    console.log('📊 Statistics:');
    console.log(`   - Total Orders: ${totalOrders}`);
    console.log(`   - Total Revenue: $${totalRevenue.toFixed(2)}`);
    console.log(`   - Average Orders per User: ${avgOrdersPerUser.toFixed(2)}`);
    console.log(`   - Average Spent per User: $${avgSpentPerUser.toFixed(2)}\n`);
    
    // Users with most orders
    const usersByOrderCount = [...sortedUsers].sort((a, b) => b.orders.length - a.orders.length);
    
    console.log('🏆 Users with Most Orders:\n');
    console.log('-'.repeat(80));
    console.log(
      'Email'.padEnd(35) + 
      'Name'.padEnd(20) + 
      'Orders'.padEnd(10) + 
      'Total Spent'.padEnd(15)
    );
    console.log('-'.repeat(80));
    
    usersByOrderCount.slice(0, 10).forEach((userData, index) => {
      console.log(
        `${(index + 1).toString().padStart(2)}. ${userData.user.email.padEnd(32)} ` +
        `${userData.user.name.substring(0, 18).padEnd(20)} ` +
        `${userData.orders.length.toString().padEnd(10)} ` +
        `$${userData.totalSpent.toFixed(2)}`
      );
    });
    
    console.log('-'.repeat(80));
    console.log();
    
    // Export to CSV option
    console.log('💾 Exporting to CSV...');
    const csv = [
      'Email,Name,Order Count,Total Spent,Paid Amount,Has Address',
      ...sortedUsers.map(u => 
        `"${u.user.email}","${u.user.name}",${u.orders.length},${u.totalSpent.toFixed(2)},${u.paidAmount.toFixed(2)},${u.user.addresses.length > 0 ? 'Yes' : 'No'}`
      )
    ].join('\n');
    
    const fs = require('fs');
    const csvPath = path.join(__dirname, '../migrated-users.csv');
    fs.writeFileSync(csvPath, csv);
    console.log(`✅ CSV exported to: ${csvPath}\n`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Run
if (require.main === module) {
  listMigratedUsers()
    .then(() => {
      console.log('✅ Complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}

module.exports = { listMigratedUsers };
