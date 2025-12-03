require('dotenv').config();
const connectDB = require('../src/config/db');
const BlogPost = require('../src/models/blog.model');
const { cloudinary } = require('../src/config/cloudinary');

const clearPosts = async () => {
    try {
        console.log('🗑️  Clearing all blog posts...\n');

        // Connect to database
        await connectDB();
        console.log('✅ Database connected\n');

        // Get all posts with images
        const postsWithImages = await BlogPost.find({ 'coverImage.publicId': { $exists: true } });
        console.log(`📸 Found ${postsWithImages.length} posts with Cloudinary images\n`);

        // Delete images from Cloudinary
        if (postsWithImages.length > 0) {
            console.log('☁️  Deleting images from Cloudinary...');
            let deletedCount = 0;
            let errorCount = 0;

            for (const post of postsWithImages) {
                try {
                    if (post.coverImage?.publicId) {
                        await cloudinary.uploader.destroy(post.coverImage.publicId);
                        deletedCount++;
                        console.log(`   ✅ Deleted: ${post.coverImage.publicId}`);
                    }
                } catch (error) {
                    errorCount++;
                    console.log(`   ❌ Error deleting ${post.coverImage.publicId}: ${error.message}`);
                }
            }

            console.log(`\n📊 Cloudinary Cleanup:`);
            console.log(`   ✅ Deleted: ${deletedCount}`);
            console.log(`   ❌ Errors: ${errorCount}\n`);
        }

        // Delete all posts from database
        const result = await BlogPost.deleteMany({});
        console.log(`✅ Deleted ${result.deletedCount} posts from database\n`);

        console.log('🎉 Cleanup completed!\n');
        process.exit(0);

    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        process.exit(1);
    }
};

clearPosts();
