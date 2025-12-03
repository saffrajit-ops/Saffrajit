require('dotenv').config();
const https = require('https');
const http = require('http');
const connectDB = require('../src/config/db');
const BlogPost = require('../src/models/blog.model');
const { cloudinary } = require('../src/config/cloudinary');

// WordPress API Configuration
const WP_API_URL = 'https://canagoldbeauty.com/wp-json/wp/v2/posts';
const BATCH_SIZE = 100;

// Helper function to strip HTML tags
const stripHtml = (html) => {
    return html.replace(/<[^>]*>/g, '').replace(/&[^;]+;/g, ' ').trim();
};

// Helper function to generate slug from title
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
};

// Helper function to extract excerpt from content
const extractExcerpt = (content, maxLength = 300) => {
    const text = stripHtml(content);
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3).trim() + '...';
};

// Helper function to fetch data from URL
const fetchFromUrl = (url) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (error) {
                    reject(error);
                }
            });
        }).on('error', reject);
    });
};

// Helper function to download image as buffer
const downloadImage = (url) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
        }).on('error', reject);
    });
};

// Helper function to upload image to Cloudinary
const uploadToCloudinary = async (imageUrl) => {
    try {
        if (!imageUrl) return null;

        const imageBuffer = await downloadImage(imageUrl);

        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
                {
                    folder: 'blog-posts',
                    transformation: [
                        { width: 1200, height: 630, crop: 'limit' },
                        { quality: 'auto' }
                    ]
                },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            uploadStream.end(imageBuffer);
        });

    } catch (error) {
        throw error;
    }
};

// Process a single batch of posts
const processBatch = async (posts, batchNumber, totalBatches) => {
    const batchStats = {
        total: posts.length,
        success: 0,
        skipped: 0,
        failed: 0,
        imageUploadErrors: 0,
        errors: []
    };

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📦 BATCH ${batchNumber}/${totalBatches} - Processing ${posts.length} posts`);
    console.log(`${'='.repeat(80)}\n`);

    for (let i = 0; i < posts.length; i++) {
        const post = posts[i];
        const postNumber = (batchNumber - 1) * BATCH_SIZE + i + 1;

        try {
            const title = stripHtml(post.title?.rendered || 'Untitled');
            console.log(`[${postNumber}] Processing: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}`);

            // Check if post already exists by slug
            const slug = post.slug || generateSlug(post.title?.rendered || '');
            const existingPost = await BlogPost.findOne({ slug });

            if (existingPost) {
                console.log(`    ⏭️  Already exists - Skipped`);
                batchStats.skipped++;
                continue;
            }

            // Prepare blog post data
            const blogPostData = {
                title: title,
                slug: slug,
                excerpt: post.excerpt?.rendered
                    ? extractExcerpt(post.excerpt.rendered)
                    : extractExcerpt(post.content?.rendered || ''),
                body: post.content?.rendered || '',
                author: post.yoast_head_json?.author || 'Admin',
                isPublished: post.status === 'publish',
                publishedAt: post.status === 'publish' ? new Date(post.date) : null,
                viewCount: 0,
                tags: post.yoast_head_json?.twitter_misc?.['Written by']
                    ? [post.yoast_head_json.twitter_misc['Written by']]
                    : [],
                category: 'Uncategorized',
                meta: {
                    title: post.yoast_head_json?.og_title || title,
                    description: post.yoast_head_json?.og_description
                        ? extractExcerpt(post.yoast_head_json.og_description, 300)
                        : extractExcerpt(post.content?.rendered || '', 300),
                    keywords: post.yoast_head_json?.schema?.['@graph']?.[0]?.keywords || [],
                    canonicalUrl: post.yoast_head_json?.canonical || post.link
                },
                createdAt: new Date(post.date),
                updatedAt: new Date(post.modified)
            };

            // Upload cover image to Cloudinary if available
            let imageUploaded = false;
            if (post.yoast_head_json?.og_image?.[0]?.url) {
                const imageUrl = post.yoast_head_json.og_image[0].url;
                try {
                    const cloudinaryResult = await uploadToCloudinary(imageUrl);
                    
                    if (cloudinaryResult) {
                        blogPostData.coverImage = {
                            url: cloudinaryResult.secure_url,
                            publicId: cloudinaryResult.public_id,
                            alt: title
                        };
                        imageUploaded = true;
                        console.log(`    📸 Image uploaded to Cloudinary`);
                    }
                } catch (imageError) {
                    batchStats.imageUploadErrors++;
                    console.log(`    ⚠️  Image upload failed: ${imageError.message}`);
                    batchStats.errors.push({
                        post: title,
                        type: 'Image Upload Error',
                        error: imageError.message
                    });
                }
            }

            // Create blog post
            await BlogPost.create(blogPostData);
            batchStats.success++;
            console.log(`    ✅ Post saved to database`);

        } catch (error) {
            batchStats.failed++;
            const title = stripHtml(post.title?.rendered || 'Unknown');
            console.log(`    ❌ Failed: ${error.message}`);
            batchStats.errors.push({
                post: title,
                type: 'Database Error',
                error: error.message
            });
        }
    }

    // Batch Summary
    console.log(`\n${'-'.repeat(80)}`);
    console.log(`📊 BATCH ${batchNumber} SUMMARY:`);
    console.log(`   📝 Total Posts: ${batchStats.total}`);
    console.log(`   ✅ Successfully Added: ${batchStats.success}`);
    console.log(`   ⏭️  Skipped (Already Exists): ${batchStats.skipped}`);
    console.log(`   ❌ Failed: ${batchStats.failed}`);
    console.log(`   📸 Image Upload Errors: ${batchStats.imageUploadErrors}`);
    
    if (batchStats.errors.length > 0) {
        console.log(`\n   ⚠️  ERROR DETAILS:`);
        batchStats.errors.forEach((err, idx) => {
            console.log(`   ${idx + 1}. [${err.type}] ${err.post}`);
            console.log(`      Error: ${err.error}`);
        });
    }
    console.log(`${'-'.repeat(80)}\n`);

    return batchStats;
};

const importPosts = async () => {
    const overallStats = {
        totalPosts: 0,
        totalSuccess: 0,
        totalSkipped: 0,
        totalFailed: 0,
        totalImageErrors: 0,
        batchResults: []
    };

    try {
        console.log('\n🚀 WORDPRESS TO MONGODB IMPORT');
        console.log(`${'='.repeat(80)}`);
        console.log(`📍 API URL: ${WP_API_URL}`);
        console.log(`📦 Batch Size: ${BATCH_SIZE} posts per batch`);
        console.log(`${'='.repeat(80)}\n`);

        // Connect to database
        console.log('🔌 Connecting to MongoDB...');
        await connectDB();
        console.log('✅ Database connected\n');

        // Fetch total count first
        console.log('📡 Fetching total post count...');
        const firstPageUrl = `${WP_API_URL}?per_page=1&page=1`;
        const firstPageResponse = await fetchFromUrl(firstPageUrl);
        
        // Calculate total pages
        let page = 1;
        let hasMore = true;
        let totalBatches = 0;

        console.log('📊 Calculating total batches...\n');

        // Process batches one by one
        while (hasMore) {
            try {
                const url = `${WP_API_URL}?per_page=${BATCH_SIZE}&page=${page}`;
                console.log(`📥 Fetching Batch ${page}...`);
                
                const posts = await fetchFromUrl(url);
                
                if (posts.length === 0) {
                    hasMore = false;
                    break;
                }

                overallStats.totalPosts += posts.length;
                totalBatches = page;

                // Process this batch immediately
                const batchStats = await processBatch(posts, page, '?');
                
                // Update overall stats
                overallStats.totalSuccess += batchStats.success;
                overallStats.totalSkipped += batchStats.skipped;
                overallStats.totalFailed += batchStats.failed;
                overallStats.totalImageErrors += batchStats.imageUploadErrors;
                overallStats.batchResults.push({
                    batch: page,
                    ...batchStats
                });

                page++;

            } catch (error) {
                if (error.message && error.message.includes('400')) {
                    // No more pages
                    hasMore = false;
                } else {
                    throw error;
                }
            }
        }

        // Final Summary
        console.log(`\n${'='.repeat(80)}`);
        console.log(`🎉 IMPORT COMPLETED!`);
        console.log(`${'='.repeat(80)}`);
        console.log(`\n📊 OVERALL STATISTICS:`);
        console.log(`   📝 Total Posts Processed: ${overallStats.totalPosts}`);
        console.log(`   ✅ Successfully Added: ${overallStats.totalSuccess}`);
        console.log(`   ⏭️  Skipped (Already Exists): ${overallStats.totalSkipped}`);
        console.log(`   ❌ Failed: ${overallStats.totalFailed}`);
        console.log(`   📸 Image Upload Errors: ${overallStats.totalImageErrors}`);
        console.log(`   📦 Total Batches: ${totalBatches}`);

        if (overallStats.totalFailed > 0) {
            console.log(`\n⚠️  BATCHES WITH ERRORS:`);
            overallStats.batchResults.forEach((batch) => {
                if (batch.failed > 0 || batch.imageUploadErrors > 0) {
                    console.log(`   Batch ${batch.batch}: ${batch.failed} failed, ${batch.imageUploadErrors} image errors`);
                }
            });
        }

        console.log(`\n${'='.repeat(80)}\n`);

        process.exit(0);

    } catch (error) {
        console.error('\n❌ IMPORT FAILED:', error.message);
        console.error(error);
        process.exit(1);
    }
};

// Run the import
importPosts();
