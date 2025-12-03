require('dotenv').config();
const mongoose = require('mongoose');
const HeroSection = require('../src/models/heroSection.model');
const LuxuryShowcase = require('../src/models/luxuryShowcase.model');

const testAPI = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    // Check Hero Section
    console.log('📝 Checking Hero Section...');
    const hero = await HeroSection.findOne();
    if (hero) {
      console.log('✅ Hero Section found:');
      console.log('   Title:', hero.title);
      console.log('   Video URL:', hero.video.url);
      console.log('   Is Active:', hero.isActive);
      console.log('   Public ID:', hero.video.publicId);
    } else {
      console.log('❌ No Hero Section found in database');
    }

    // Check Luxury Showcase
    console.log('\n📝 Checking Luxury Showcase...');
    const luxury = await LuxuryShowcase.findOne();
    if (luxury) {
      console.log('✅ Luxury Showcase found:');
      console.log('   Title:', luxury.title);
      console.log('   Video URL:', luxury.video.url);
      console.log('   Is Active:', luxury.isActive);
      console.log('   Public ID:', luxury.video.publicId);
    } else {
      console.log('❌ No Luxury Showcase found in database');
    }

    console.log('\n💡 Next steps:');
    if (!hero || !luxury) {
      console.log('   Run: npm run seed-sections');
    }
    if (hero?.video.url.startsWith('/') || luxury?.video.url.startsWith('/')) {
      console.log('   Videos are local URLs, run: npm run migrate-videos');
    }
    if (hero?.video.url.includes('cloudinary') && luxury?.video.url.includes('cloudinary')) {
      console.log('   ✅ Videos are on Cloudinary!');
      console.log('   Make sure backend is running: npm run dev');
      console.log('   Check API: http://localhost:5000/api/hero-section');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

testAPI();
