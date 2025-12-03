require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../src/models/product.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const generateProductId = (index) => {
  // Generate a unique product_id like: PROD-0001, PROD-0002, etc.
  return `PROD-${String(index).padStart(4, '0')}`;
};

const addProductIdToAllProducts = async () => {
  try {
    console.log('\n📝 Starting product_id migration...\n');

    // Get all products
    const products = await Product.find({}).sort({ createdAt: 1 });
    
    if (products.length === 0) {
      console.log('⚠️  No products found in database');
      return;
    }

    console.log(`📦 Found ${products.length} products\n`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each product
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      try {
        // Check if product already has product_id
        if (product.product_id) {
          console.log(`⏭️  [${i + 1}/${products.length}] Skipped: "${product.title}" (already has product_id: ${product.product_id})`);
          skippedCount++;
          continue;
        }

        // Generate new product_id
        const productId = generateProductId(i + 1);

        // Update product using updateOne to avoid validation issues
        await Product.updateOne(
          { _id: product._id },
          { $set: { product_id: productId } }
        );

        console.log(`✅ [${i + 1}/${products.length}] Updated: "${product.title}" → product_id: ${productId}`);
        updatedCount++;

      } catch (error) {
        console.error(`❌ [${i + 1}/${products.length}] Error updating "${product.title}":`, error.message);
        errorCount++;
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`📦 Total Products:        ${products.length}`);
    console.log(`✅ Successfully Updated:  ${updatedCount}`);
    console.log(`⏭️  Skipped (existing):   ${skippedCount}`);
    console.log(`❌ Errors:                ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    // Verify the changes
    console.log('🔍 Verifying changes...\n');
    const productsWithId = await Product.countDocuments({ product_id: { $exists: true, $ne: null } });
    const productsWithoutId = await Product.countDocuments({ product_id: { $exists: false } });
    
    console.log(`✅ Products with product_id:    ${productsWithId}`);
    console.log(`⚠️  Products without product_id: ${productsWithoutId}\n`);

    if (productsWithoutId > 0) {
      console.log('⚠️  Warning: Some products still don\'t have product_id');
      const missingProducts = await Product.find({ product_id: { $exists: false } }).select('title _id');
      console.log('Missing product_id for:');
      missingProducts.forEach(p => console.log(`   - ${p.title} (${p._id})`));
    }

  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
};

const main = async () => {
  try {
    console.log('🚀 Starting product_id migration script...\n');
    
    await connectDB();
    await addProductIdToAllProducts();
    
    console.log('✅ Migration completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

main();
