require('dotenv').config();
const mongoose = require('mongoose');
const HeroSection = require('../src/models/heroSection.model');
const LuxuryShowcase = require('../src/models/luxuryShowcase.model');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const staticData = {
  heroSection: {
    title: 'Luxury Redefined',
    subtitle: 'WHERE NATURE MEETS SCIENCE',
    description: 'Experience the power of 24K Nano Gold and nature\'s finest ingredients. Our revolutionary formulas combine cutting-edge technology with the purest natural extracts.',
    buttonText: 'DISCOVER COLLECTION',
    buttonLink: '/skincare',
    video: {
      url: '/video1.mp4',
      publicId: 'local-video-1',
    },
    isActive: true,
  },
  luxuryShowcase: {
    title: 'The Perfect Gift',
    subtitle: 'LUXURY GIFT SETS',
    description: 'Curated collections featuring 24K Gold & Caviar treatments, from daily rejuvenation to overnight luxury and instant lifting solutions. Each set is elegantly packaged for the ultimate gifting experience.',
    buttonText: 'EXPLORE GIFT SETS',
    buttonLink: '/gifts',
    video: {
      url: '/video2.mp4',
      publicId: 'local-video-2',
    },
    isActive: true,
  },
};

const seedStaticData = async () => {
  try {
    console.log('🚀 Starting static data upload...\n');
    console.log('=' .repeat(60));
    
    await connectDB();

    // Seed Hero Section
    console.log('\n📝 Processing Hero Section...');
    const heroExists = await HeroSection.findOne();
    
    if (heroExists) {
      console.log('⚠️  Hero section already exists');
      console.log('   ID:', heroExists._id);
      console.log('   Title:', heroExists.title);
      console.log('   Status:', heroExists.isActive ? '✅ Active' : '❌ Inactive');
      console.log('   ℹ️  Use admin panel to update or delete existing data');
    } else {
      const hero = await HeroSection.create(staticData.heroSection);
      console.log('✅ Hero section created successfully');
      console.log('   ID:', hero._id);
      console.log('   Title:', hero.title);
      console.log('   Video:', hero.video.url);
    }

    // Seed Luxury Showcase
    console.log('\n📝 Processing Luxury Showcase...');
    const showcaseExists = await LuxuryShowcase.findOne();
    
    if (showcaseExists) {
      console.log('⚠️  Luxury showcase already exists');
      console.log('   ID:', showcaseExists._id);
      console.log('   Title:', showcaseExists.title);
      console.log('   Status:', showcaseExists.isActive ? '✅ Active' : '❌ Inactive');
      console.log('   ℹ️  Use admin panel to update or delete existing data');
    } else {
      const showcase = await LuxuryShowcase.create(staticData.luxuryShowcase);
      console.log('✅ Luxury showcase created successfully');
      console.log('   ID:', showcase._id);
      console.log('   Title:', showcase.title);
      console.log('   Video:', showcase.video.url);
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Static data upload completed!\n');
    console.log('💡 Next steps:');
    console.log('   1. Run: npm run migrate-videos (to upload videos to Cloudinary)');
    console.log('   2. Access admin panel at: /dashboard/sections');
    console.log('   3. View sections on frontend homepage\n');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Seed failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  seedStaticData();
}

module.exports = { seedStaticData, staticData };
