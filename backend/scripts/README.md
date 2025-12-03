# Migration Scripts

This folder contains scripts for migrating data from WordPress WooCommerce to the new Next.js e-commerce platform.

## 📁 Scripts Overview

### Migration Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `test-migration-data.js` | Analyze WordPress data before migration | `npm run test-migration` |
| `migrate-wordpress-data.js` | Main migration script - imports all data | `npm run migrate-wp` |
| `verify-migration.js` | Verify migrated data integrity | `npm run verify-migration` |
| `list-migrated-users.js` | List users with order statistics | `npm run list-migrated-users` |

### Other Scripts

| Script | Purpose | Command |
|--------|---------|---------|
| `create-admin.js` | Create admin user | `npm run create-admin` |
| `seed-static-data.js` | Seed static data | `npm run seed-static` |
| `seed-banners.js` | Seed banner data | - |
| `check-banners.js` | Check banner configuration | - |
| `migrate-videos.js` | Migrate video data | `npm run migrate-videos` |
| `add-product-id.js` | Add product IDs | - |

## 🚀 Quick Start

### Complete Migration Process

```bash
# 1. Analyze data (optional)
npm run test-migration

# 2. Run migration
npm run migrate-wp

# 3. Verify results
npm run verify-migration

# 4. List migrated users (optional)
npm run list-migrated-users
```

## 📊 Migration Results

After running the migration, you should see:

- ✅ **64 users** created (only users with orders)
- ✅ **135 orders** migrated
- ✅ **$60,250.40** in total order value
- ✅ **8 coupons** embedded in orders
- ✅ **20 products** referenced

## 📖 Documentation

For detailed information, see:

- **[QUICK_START_MIGRATION.md](../QUICK_START_MIGRATION.md)** - Quick reference guide
- **[MIGRATION_GUIDE.md](../MIGRATION_GUIDE.md)** - Complete documentation
- **[MIGRATION_SUMMARY.md](../MIGRATION_SUMMARY.md)** - Results and statistics

## 🔧 Script Details

### test-migration-data.js

**Purpose**: Analyze WordPress data structure before migration

**What it does**:
- Loads WordPress JSON files
- Counts records in each table
- Identifies customers with orders
- Shows sample data
- Analyzes order statuses
- Lists unique products

**Output**:
```
📊 Data Counts:
- Users: 6081
- Customers: 4151
- Orders: 141
- Order Products: 159
- Order Coupons: 8

👥 Customers with orders: 67
```

---

### migrate-wordpress-data.js

**Purpose**: Main migration script - imports all data

**What it does**:
1. Connects to MongoDB
2. Loads WordPress data from JSON files
3. Identifies customers who have placed orders
4. Creates user accounts (with random passwords)
5. Maps and creates orders with products
6. Embeds coupon information in orders
7. Generates detailed migration report

**Features**:
- ✅ Idempotent (safe to run multiple times)
- ✅ Skips existing records automatically
- ✅ Validates data before insertion
- ✅ Detailed logging with emojis
- ✅ Error handling for each record

**Output**:
```
============================================================
STEP 1: Migrating Users
============================================================

✅ Created user: lucy@canagoldbeauty.com
✅ Created user: i_kall@yahoo.com
⏭️  User fixlsolutions@gmail.com already exists, skipping...

📊 User Migration Summary:
   - Created: 64
   - Skipped: 3
   - Total: 67
```

---

### verify-migration.js

**Purpose**: Verify migrated data integrity

**What it checks**:
- Count of migrated users and orders
- Order status distribution
- Revenue statistics (total and paid)
- Sample data inspection
- Orders with coupons
- Incomplete data warnings

**Output**:
```
📊 Migration Statistics:
   - Migrated Users: 63
   - Migrated Orders: 135
   - Total Users in DB: 76
   - Total Orders in DB: 154

💰 Revenue Statistics:
   - Total Revenue: $60,250.40
   - Paid Revenue: $23,323.40
   - Average Order Value: $446.30
```

---

### list-migrated-users.js

**Purpose**: List all migrated users with statistics

**What it does**:
- Lists all migrated users
- Shows order counts per user
- Calculates total spent per user
- Sorts by spending and order count
- Exports data to CSV

**Output**:
```
Top Customers by Total Spent:

Email                              Name                Orders     Total Spent
--------------------------------------------------------------------------------
 1. lucy@canagoldbeauty.com        Lucy Khalife        5          $2,345.00
 2. fixlsolutions@gmail.com        Shashank Sharma     12         $1,890.50
...

💾 Exporting to CSV...
✅ CSV exported to: backend/migrated-users.csv
```

## 🗂️ Data Sources

The migration reads from these WordPress export files:

```
backend/database/
├── users/
│   ├── wpuf_users.json                    (6,081 users)
│   └── wpuf_wc_customer_lookup.json       (4,151 customers)
└── orders/
    ├── wpuf_wc_order_stats.json           (141 orders)
    ├── wpuf_wc_order_product_lookup.json  (159 order items)
    └── wpuf_wc_order_coupon_lookup.json   (8 coupon usages)
```

## ⚙️ Configuration

### Environment Variables

Required in `backend/.env`:

```env
MONGODB_URI=mongodb+srv://...
PORT=5000
NODE_ENV=development
```

### Prerequisites

1. ✅ MongoDB connection configured
2. ✅ Products already imported in database
3. ✅ WordPress JSON files in `backend/database/`
4. ✅ Node.js and npm installed

## 🔄 Re-running Migration

The migration script is **idempotent** and safe to run multiple times:

- Checks for existing users by email
- Checks for existing orders by order number
- Skips duplicate records automatically
- No data loss or duplication

```bash
# Safe to run again
npm run migrate-wp
```

## ⚠️ Important Notes

### User Passwords
- All migrated users have randomly generated passwords
- Users MUST reset their passwords to log in
- Use "Forgot Password" feature or Google OAuth

### Missing Products
- 2 products not found in database (IDs: 1569, 195)
- Orders with only these products were skipped
- 6 orders affected

### Address Data
- Only complete addresses are imported
- 4 users don't have address information
- 6 orders don't have shipping addresses
- Missing line1 set to "Address not provided"

## 🐛 Troubleshooting

### Error: "MONGODB_URI undefined"
**Solution**: Check that `.env` file exists in `backend/` folder

### Error: "Product not found"
**Solution**: Import products first, then run migration

### Warning: "User already exists"
**Solution**: This is normal - script skips duplicates

### Error: "Address validation failed"
**Solution**: Script now handles incomplete addresses automatically

## 📈 Success Criteria

After successful migration:

- ✅ 64 users created
- ✅ 135 orders created
- ✅ All order statuses mapped correctly
- ✅ Payment information preserved
- ✅ Coupon data embedded
- ✅ No validation errors
- ✅ Verification script passes

## 🎯 Next Steps

After migration:

1. **Verify Data**
   ```bash
   npm run verify-migration
   ```

2. **Review Users**
   ```bash
   npm run list-migrated-users
   ```

3. **Notify Users**
   - Send welcome emails
   - Provide password reset instructions

4. **Test System**
   - Test user login
   - Verify order history
   - Check order details

## 📞 Support

For issues or questions:

1. Check the detailed documentation in `MIGRATION_GUIDE.md`
2. Review the migration summary in `MIGRATION_SUMMARY.md`
3. Inspect console output for error messages
4. Check MongoDB directly using Compass

## 🎉 Success!

If all scripts run without errors, your WordPress data has been successfully migrated to the new Next.js platform!

**Migration Complete**: 64 users, 135 orders, $60,250.40 in order value preserved! 🚀
