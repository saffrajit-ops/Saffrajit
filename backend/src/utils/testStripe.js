require('dotenv').config();

// Simple test to verify Stripe configuration
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testStripeConnection() {
  try {
    console.log('Testing Stripe connection...');
    
    // Test API connection
    const account = await stripe.accounts.retrieve();
    console.log('✅ Stripe connection successful');
    console.log('Account ID:', account.id);
    console.log('Country:', account.country);
    console.log('Currency:', account.default_currency);
    
    // Test creating a simple product (for testing)
    console.log('\nTesting product creation...');
    const product = await stripe.products.create({
      name: 'Test Product',
      description: 'This is a test product for API verification'
    });
    console.log('✅ Test product created:', product.id);
    
    // Clean up - delete the test product
    await stripe.products.del(product.id);
    console.log('✅ Test product cleaned up');
    
    console.log('\n🎉 All Stripe tests passed!');
    console.log('\nNext steps:');
    console.log('1. Set up webhook endpoint in Stripe Dashboard');
    console.log('2. Use Stripe CLI to test webhooks locally');
    console.log('3. Test checkout flow with your frontend');
    
  } catch (error) {
    console.error('❌ Stripe test failed:', error.message);
    
    if (error.type === 'StripeAuthenticationError') {
      console.log('\n💡 Check your STRIPE_SECRET_KEY in .env file');
    }
  }
}

// Run the test
testStripeConnection();