require('dotenv').config();
const mongoose = require('mongoose');
const Banner = require('../src/models/banner.model');
const { uploadImage } = require('../src/config/cloudinary');
const fs = require('fs').promises;
const path = require('path');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const uploadBannerImage = async (imagePath, folder = 'banners') => {
    try {
        console.log(`📤 Uploading image: ${imagePath}`);

        const imageBuffer = await fs.readFile(imagePath);
        const result = await uploadImage(imageBuffer, { folder });

        console.log(`✅ Image uploaded: ${result.secure_url}`);

        return {
            url: result.secure_url,
            publicId: result.public_id,
        };
    } catch (error) {
        console.error(`❌ Error uploading image:`, error);
        throw error;
    }
};

const seedBanners = async () => {
    try {
        console.log('\n🎨 Starting banner seeding...\n');

        // Clear existing banners (optional - comment out if you want to keep existing)
        // await Banner.deleteMany({});
        // console.log('🗑️  Cleared existing banners\n');

        const bannersToCreate = [];

        // 1. POPUP BANNER - Device Trigger (Mobile Only)
        console.log('[1/10] Creating popup banner with device trigger (mobile)...');
        const popup1Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24K-Gold-Collagen-Mask-1.png'),
            'banners/popup'
        );
        bannersToCreate.push({
            title: 'Mobile Exclusive: 24K Gold Collagen Mask',
            description: 'Special offer for mobile users! Get 20% off on our bestselling collagen mask.',
            image: popup1Image,
            type: 'popup',
            link: '/product/24k-gold-caviar-collagen-mask',
            linkText: 'Shop Now',
            pages: ['home', 'skincare'],
            triggers: {
                device: {
                    enabled: true,
                    types: ['mobile']
                },
                behavior: {
                    enabled: false
                },
                userType: {
                    enabled: false
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 2. POPUP BANNER - User Type Trigger (New Users)
        console.log('[2/10] Creating popup banner with user type trigger (new users)...');
        const popup2Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/Gift-Set-Non-Surgical-Instant-Lifting-Mask-Hebe-1.png'),
            'banners/popup'
        );
        bannersToCreate.push({
            title: 'Welcome! First Time Visitor Special',
            description: 'Get 15% off your first purchase! Discover our luxury gift sets.',
            image: popup2Image,
            type: 'popup',
            link: '/gifts',
            linkText: 'Claim Offer',
            pages: ['home'],
            triggers: {
                device: {
                    enabled: false
                },
                behavior: {
                    enabled: false
                },
                userType: {
                    enabled: true,
                    types: ['guest', 'new-user']
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 3. POPUP BANNER - Behavior Trigger (Exit Intent)
        console.log('[3/10] Creating popup banner with exit intent trigger...');
        const popup3Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24K-Gold-Magnetic-Mask-1.png'),
            'banners/popup'
        );
        bannersToCreate.push({
            title: 'Wait! Don\'t Leave Empty Handed',
            description: 'Get 10% off with code STAY10. Limited time offer!',
            image: popup3Image,
            type: 'popup',
            link: '/skincare',
            linkText: 'Get Discount',
            pages: ['home', 'skincare', 'gifts'],
            triggers: {
                device: {
                    enabled: false
                },
                behavior: {
                    enabled: true,
                    exitIntent: true,
                    scrollPercentage: undefined,
                    addToCart: false,
                    searchKeywords: []
                },
                userType: {
                    enabled: false
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 4. POPUP BANNER - Behavior Trigger (Add to Cart)
        console.log('[4/10] Creating popup banner with add-to-cart trigger...');
        const popup4Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24K-Daily-Rejuvenating-Skin-Treatment-Gift-Set-1.png'),
            'banners/popup'
        );
        bannersToCreate.push({
            title: 'Complete Your Skincare Routine',
            description: 'Add our Daily Rejuvenating Set and save 25%!',
            image: popup4Image,
            type: 'popup',
            link: '/gifts',
            linkText: 'Add to Cart',
            pages: ['product-detail'],
            triggers: {
                device: {
                    enabled: false
                },
                behavior: {
                    enabled: true,
                    exitIntent: false,
                    scrollPercentage: undefined,
                    addToCart: true,
                    searchKeywords: []
                },
                userType: {
                    enabled: false
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 5. SIDEBAR BANNER - Scroll Trigger (50%)
        console.log('[5/10] Creating sidebar banner with scroll trigger...');
        const sidebar1Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24K-Gold-Caviar-2-in-1-Hydro_boosting-Daily-Treatment.png'),
            'banners/sidebar'
        );
        bannersToCreate.push({
            title: 'Hydro-Boosting Daily Treatment',
            description: 'Scroll special! Deep hydration with 24K gold.',
            image: sidebar1Image,
            type: 'sidebar',
            link: '/product/24k-gold-caviar-2-in-1-hydro-boosting-daily-treatment',
            linkText: 'Learn More',
            pages: ['home', 'skincare'],
            triggers: {
                device: {
                    enabled: false
                },
                behavior: {
                    enabled: true,
                    exitIntent: false,
                    scrollPercentage: 50,
                    addToCart: false,
                    searchKeywords: []
                },
                userType: {
                    enabled: false
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 6. SIDEBAR BANNER - Returning Users
        console.log('[6/10] Creating sidebar banner for returning users...');
        const sidebar2Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24K-Gold-Caviar-2-in-1-Overnight-Treatment-1.png'),
            'banners/sidebar'
        );
        bannersToCreate.push({
            title: 'Welcome Back! Overnight Treatment',
            description: 'Exclusive for our loyal customers - 20% off!',
            image: sidebar2Image,
            type: 'sidebar',
            link: '/product/24k-gold-caviar-2-in-1-overnight-treatment',
            linkText: 'Shop Now',
            pages: ['home', 'skincare', 'profile'],
            triggers: {
                device: {
                    enabled: false
                },
                behavior: {
                    enabled: false
                },
                userType: {
                    enabled: true,
                    types: ['returning-user', 'logged-in']
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 7. SIDEBAR BANNER - Desktop Only
        console.log('[7/10] Creating sidebar banner for desktop users...');
        const sidebar3Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24K-Non-Surgical-Instant-Lifting-Solution-1.png'),
            'banners/sidebar'
        );
        bannersToCreate.push({
            title: 'Desktop Exclusive: Instant Lifting',
            description: 'Non-surgical instant lifting solution. See results in minutes!',
            image: sidebar3Image,
            type: 'sidebar',
            link: '/product/24k-non-surgical-instant-lifting-solution',
            linkText: 'Discover',
            pages: ['home', 'skincare', 'product-detail'],
            triggers: {
                device: {
                    enabled: true,
                    types: ['desktop']
                },
                behavior: {
                    enabled: false
                },
                userType: {
                    enabled: false
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 8. FOOTER BANNER - All Devices, All Users
        console.log('[8/10] Creating footer banner (no triggers)...');
        const footer1Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24k-Oxygen-Brightening.png'),
            'banners/footer'
        );
        bannersToCreate.push({
            title: 'Oxygen Brightening Treatment - New Arrival',
            description: 'Revolutionary oxygen-infused formula for radiant, glowing skin',
            image: footer1Image,
            type: 'footer',
            link: '/product/24k-oxygen-brightening-treatment',
            linkText: 'Explore Now',
            pages: ['home', 'skincare', 'gifts', 'about'],
            triggers: {
                device: {
                    enabled: false
                },
                behavior: {
                    enabled: false
                },
                userType: {
                    enabled: false
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 9. FOOTER BANNER - Search Keywords Trigger
        console.log('[9/10] Creating footer banner with search keyword trigger...');
        const footer2Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24k-Gold-Caviar-2-in-1-Brightening-Whitening-Treatment.png'),
            'banners/footer'
        );
        bannersToCreate.push({
            title: 'Brightening & Whitening Treatment',
            description: 'Found what you\'re looking for? Get 15% off brightening products!',
            image: footer2Image,
            type: 'footer',
            link: '/skincare',
            linkText: 'Shop Brightening',
            pages: ['home', 'skincare', 'product-detail'],
            triggers: {
                device: {
                    enabled: false
                },
                behavior: {
                    enabled: true,
                    exitIntent: false,
                    scrollPercentage: undefined,
                    addToCart: false,
                    searchKeywords: ['brightening', 'whitening', 'glow', 'radiant', 'luminous']
                },
                userType: {
                    enabled: false
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // 10. FOOTER BANNER - Multiple Triggers (Device + User Type)
        console.log('[10/10] Creating footer banner with multiple triggers...');
        const footer3Image = await uploadBannerImage(
            path.join(__dirname, '../public/products-image/24K-Gold-Caviar-2-in-1-Eye-Contouring-Repair-Complex-1.png'),
            'banners/footer'
        );
        bannersToCreate.push({
            title: 'Premium Members: Eye Contouring Complex',
            description: 'Exclusive offer for premium members on mobile devices',
            image: footer3Image,
            type: 'footer',
            link: '/product/24k-gold-caviar-eye-contouring-repair-complex',
            linkText: 'Get Offer',
            pages: ['home', 'skincare', 'profile'],
            triggers: {
                device: {
                    enabled: true,
                    types: ['mobile', 'tablet']
                },
                behavior: {
                    enabled: false
                },
                userType: {
                    enabled: true,
                    types: ['premium', 'logged-in']
                },
                inventory: {
                    enabled: false
                }
            },
            startDate: new Date(),
            isActive: true
        });

        // Create all banners
        console.log('\n💾 Saving banners to database...\n');

        for (let i = 0; i < bannersToCreate.length; i++) {
            const bannerData = bannersToCreate[i];
            try {
                const banner = await Banner.create(bannerData);
                console.log(`✅ [${i + 1}/10] Created: ${banner.title}`);
                console.log(`   Type: ${banner.type}`);
                console.log(`   Pages: ${banner.pages.join(', ')}`);
                console.log(`   Triggers: ${Object.keys(banner.triggers).filter(k => banner.triggers[k]?.enabled).join(', ') || 'none'}`);
            } catch (error) {
                console.error(`❌ [${i + 1}/10] Failed to create: ${bannerData.title}`);
                console.error(`   Error: ${error.message}`);
            }
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 SEEDING SUMMARY');
        console.log('='.repeat(80));

        const allBanners = await Banner.find({});
        console.log(`Total Banners: ${allBanners.length}`);
        console.log(`Active: ${allBanners.filter(b => b.isActive).length}`);
        console.log(`Popup: ${allBanners.filter(b => b.type === 'popup').length}`);
        console.log(`Sidebar: ${allBanners.filter(b => b.type === 'sidebar').length}`);
        console.log(`Footer: ${allBanners.filter(b => b.type === 'footer').length}`);

        console.log('\n🎯 Triggers Used:');
        console.log(`   Device Triggers: ${allBanners.filter(b => b.triggers?.device?.enabled).length}`);
        console.log(`   User Type Triggers: ${allBanners.filter(b => b.triggers?.userType?.enabled).length}`);
        console.log(`   Behavior Triggers: ${allBanners.filter(b => b.triggers?.behavior?.enabled).length}`);
        console.log(`   Inventory Triggers: ${allBanners.filter(b => b.triggers?.inventory?.enabled).length}`);

        console.log('\n✅ Banner seeding completed successfully!\n');

    } catch (error) {
        console.error('❌ Error seeding banners:', error);
        throw error;
    }
};

const main = async () => {
    try {
        await connectDB();
        await seedBanners();
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Seeding failed:', error);
        process.exit(1);
    }
};

main();
