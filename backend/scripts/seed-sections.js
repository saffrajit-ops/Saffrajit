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
        console.log(`   📤 Reading video file: ${localPath}`);

        // Check if file exists
        try {
            await fs.access(localPath);
        } catch (error) {
            console.log(`   ⚠️  Video file not found, using placeholder`);
            return null;
        }

        // Read file as buffer
        const videoBuffer = await fs.readFile(localPath);

        console.log(`   📤 Uploading to Cloudinary (${folder})...`);

        // Upload using helper
        const result = await uploadVideo(videoBuffer, {
            folder: folder
        });

        console.log(`   ✅ Video uploaded: ${result.secure_url}`);

        return {
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height,
            duration: result.duration,
            format: result.format,
        };
    } catch (error) {
        console.error(`   ❌ Error uploading video:`, error.message);
        return null;
    }
};

const seedData = async () => {
    try {
        console.log('🚀 Starting seed data upload with Cloudinary videos...\n');

        await connectDB();

        // Seed Hero Section
        console.log('📝 Seeding Hero Section...');
        const heroExists = await HeroSection.findOne();

        if (heroExists) {
            console.log('⏭️  Hero section already exists, skipping...');
        } else {
            // Try to upload video to Cloudinary
            const videoPath = path.join(__dirname, '../public/video1.mp4');
            const videoData = await uploadVideoToCloudinary(videoPath, 'hero-section');

            await HeroSection.create({
                title: 'Luxury Redefined',
                subtitle: 'WHERE NATURE MEETS SCIENCE',
                description: 'Experience the power of 24K Nano Gold and nature\'s finest ingredients',
                buttonText: 'DISCOVER COLLECTION',
                buttonLink: '/skincare',
                video: videoData || {
                    url: '/video1.mp4',
                    publicId: 'placeholder-hero',
                },
                isActive: true,
            });
            console.log('✅ Hero section created');
        }

        // Seed Luxury Showcase
        console.log('\n📝 Seeding Luxury Showcase...');
        const showcaseExists = await LuxuryShowcase.findOne();

        if (showcaseExists) {
            console.log('⏭️  Luxury showcase already exists, skipping...');
        } else {
            // Try to upload video to Cloudinary
            const videoPath = path.join(__dirname, '../public/video2.mp4');
            const videoData = await uploadVideoToCloudinary(videoPath, 'luxury-showcase');

            await LuxuryShowcase.create({
                title: 'The Perfect Gift',
                subtitle: 'LUXURY GIFT SETS',
                description: 'Curated collections featuring 24K Gold & Caviar treatments, from daily rejuvenation to overnight luxury and instant lifting solutions',
                buttonText: 'EXPLORE GIFT SETS',
                buttonLink: '/gifts',
                video: videoData || {
                    url: '/video2.mp4',
                    publicId: 'placeholder-luxury',
                },
                isActive: true,
            });
            console.log('✅ Luxury showcase created');
        }

        console.log('\n✅ Seed data uploaded successfully!');
        console.log('\n💡 Tips:');
        console.log('   - If videos were not uploaded, place video1.mp4 and video2.mp4 in backend/public/');
        console.log('   - Then run: npm run migrate-videos');
        console.log('   - Or upload videos through admin panel');

        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seed failed:', error);
        process.exit(1);
    }
};

seedData();
