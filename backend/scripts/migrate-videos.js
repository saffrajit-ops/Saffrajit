require('dotenv').config();
const mongoose = require('mongoose');
const { uploadVideo } = require('../src/config/cloudinary');
const HeroSection = require('../src/models/heroSection.model');
const LuxuryShowcase = require('../src/models/luxuryShowcase.model');
const path = require('path');
const fs = require('fs').promises;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const uploadVideoToCloudinary = async (localPath, folder) => {
  try {
    console.log(`📤 Reading video file: ${localPath}`);
    
    // Read file as buffer (same as multer does)
    const videoBuffer = await fs.readFile(localPath);
    
    console.log(`📤 Uploading to Cloudinary (${folder})...`);
    
    // Use the new uploadVideo helper (same as controllers)
    const result = await uploadVideo(videoBuffer, {
      folder: folder
    });

    console.log(`✅ Video uploaded successfully: ${result.secure_url}`);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      duration: result.duration,
      format: result.format,
    };
  } catch (error) {
    console.error(`❌ Error uploading video:`, error);
    throw error;
  }
};

const migrateHeroSection = async () => {
  try {
    console.log('\n📝 Migrating Hero Section...');
    
    // Check if hero section already exists
    let heroSection = await HeroSection.findOne();
    
    if (heroSection && heroSection.video?.publicId !== 'default') {
      console.log('⏭️  Hero section already migrated, skipping...');
      return;
    }

    // Path to your local video file (in backend/public)
    const videoPath = path.join(__dirname, '../public/video1.mp4');
    
    // Upload to Cloudinary
    const videoData = await uploadVideoToCloudinary(videoPath, 'hero-section');
    
    if (heroSection) {
      // Update existing
      heroSection.video = videoData;
      await heroSection.save();
      console.log('✅ Hero section updated with Cloudinary video');
    } else {
      // Create new
      heroSection = await HeroSection.create({
        title: 'Luxury Redefined',
        subtitle: 'WHERE NATURE MEETS SCIENCE',
        description: 'Experience the power of 24K Nano Gold and nature\'s finest ingredients',
        buttonText: 'DISCOVER COLLECTION',
        buttonLink: '/skincare',
        video: videoData,
        isActive: true,
      });
      console.log('✅ Hero section created with Cloudinary video');
    }
  } catch (error) {
    console.error('❌ Error migrating hero section:', error);
  }
};

const migrateLuxuryShowcase = async () => {
  try {
    console.log('\n📝 Migrating Luxury Showcase...');
    
    // Check if luxury showcase already exists
    let luxuryShowcase = await LuxuryShowcase.findOne();
    
    if (luxuryShowcase && luxuryShowcase.video?.publicId !== 'default') {
      console.log('⏭️  Luxury showcase already migrated, skipping...');
      return;
    }

    // Path to your local video file (in backend/public)
    const videoPath = path.join(__dirname, '../public/video2.mp4');
    
    // Upload to Cloudinary
    const videoData = await uploadVideoToCloudinary(videoPath, 'luxury-showcase');
    
    if (luxuryShowcase) {
      // Update existing
      luxuryShowcase.video = videoData;
      await luxuryShowcase.save();
      console.log('✅ Luxury showcase updated with Cloudinary video');
    } else {
      // Create new
      luxuryShowcase = await LuxuryShowcase.create({
        title: 'The Perfect Gift',
        subtitle: 'LUXURY GIFT SETS',
        description: 'Curated collections featuring 24K Gold & Caviar treatments, from daily rejuvenation to overnight luxury and instant lifting solutions',
        buttonText: 'EXPLORE GIFT SETS',
        buttonLink: '/gifts',
        video: videoData,
        isActive: true,
      });
      console.log('✅ Luxury showcase created with Cloudinary video');
    }
  } catch (error) {
    console.error('❌ Error migrating luxury showcase:', error);
  }
};

const main = async () => {
  try {
    console.log('🚀 Starting video migration...\n');
    
    await connectDB();
    await migrateHeroSection();
    await migrateLuxuryShowcase();
    
    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
};

main();
