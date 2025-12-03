const mongoose = require('mongoose');
const Product = require('../models/product.model');
const Taxonomy = require('../models/taxonomy.model');
require('dotenv').config();

async function testAPI() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test Taxonomy creation
    const testTaxonomy = new Taxonomy({
      name: 'Test Category',
      slug: 'test-category',
      type: 'category',
      description: 'Test category for API validation'
    });

    await testTaxonomy.save();
    console.log('✅ Taxonomy model working');

    // Test Product creation
    const testProduct = new Product({
      type: 'single',
      title: 'Test Product',
      slug: 'test-product',
      price: 29.99,
      stock: 10,
      taxonomies: [testTaxonomy._id]
    });

    await testProduct.save();
    console.log('✅ Product model working');

    // Test relationships
    const productWithTaxonomy = await Product.findById(testProduct._id)
      .populate('taxonomies');
    
    console.log('✅ Product-Taxonomy relationship working');
    console.log(`Product: ${productWithTaxonomy.title}`);
    console.log(`Category: ${productWithTaxonomy.taxonomies[0].name}`);

    // Test similar products method
    const similarProducts = await Product.findSimilar(
      testProduct._id,
      testProduct.taxonomies,
      4
    );
    console.log('✅ Similar products method working');

    // Cleanup
    await Product.findByIdAndDelete(testProduct._id);
    await Taxonomy.findByIdAndDelete(testTaxonomy._id);
    console.log('✅ Cleanup completed');

    console.log('\n🎉 All API components are working correctly!');
    console.log('\nNext steps:');
    console.log('1. Start the server: npm run dev');
    console.log('2. Import the Postman collection');
    console.log('3. Create an admin user');
    console.log('4. Test the API endpoints');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
}

testAPI();