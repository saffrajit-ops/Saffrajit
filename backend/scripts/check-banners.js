require('dotenv').config();
const mongoose = require('mongoose');
const Banner = require('../src/models/banner.model');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ MongoDB connected');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const checkBanners = async () => {
    try {
        console.log('\n📊 Checking all banners in database...\n');

        const banners = await Banner.find({});

        console.log(`Found ${banners.length} total banners\n`);
        console.log('='.repeat(80));

        banners.forEach((banner, index) => {
            console.log(`\n[${index + 1}] Banner: ${banner.title}`);
            console.log(`    ID: ${banner._id}`);
            console.log(`    Type: ${banner.type}`);
            console.log(`    Active: ${banner.isActive}`);
            console.log(`    Pages: ${JSON.stringify(banner.pages)}`);
            console.log(`    Start Date: ${banner.startDate}`);
            console.log(`    End Date: ${banner.endDate || 'None'}`);
            console.log(`    Triggers:`);
            console.log(`      - Device: ${banner.triggers?.device?.enabled ? 'ENABLED' : 'disabled'}`);
            if (banner.triggers?.device?.enabled) {
                console.log(`        Types: ${JSON.stringify(banner.triggers.device.types)}`);
            }
            console.log(`      - User Type: ${banner.triggers?.userType?.enabled ? 'ENABLED' : 'disabled'}`);
            if (banner.triggers?.userType?.enabled) {
                console.log(`        Types: ${JSON.stringify(banner.triggers.userType.types)}`);
            }
            console.log(`      - Behavior: ${banner.triggers?.behavior?.enabled ? 'ENABLED' : 'disabled'}`);
            if (banner.triggers?.behavior?.enabled) {
                console.log(`        Scroll: ${banner.triggers.behavior.scrollPercentage || 'none'}`);
                console.log(`        Exit Intent: ${banner.triggers.behavior.exitIntent || false}`);
                console.log(`        Add to Cart: ${banner.triggers.behavior.addToCart || false}`);
                console.log(`        Keywords: ${JSON.stringify(banner.triggers.behavior.searchKeywords || [])}`);
            }
            console.log(`      - Inventory: ${banner.triggers?.inventory?.enabled ? 'ENABLED' : 'disabled'}`);
            if (banner.triggers?.inventory?.enabled) {
                console.log(`        Out of Stock: ${banner.triggers.inventory.outOfStock || false}`);
                console.log(`        COD Available: ${banner.triggers.inventory.codAvailable || false}`);
                console.log(`        Categories: ${JSON.stringify(banner.triggers.inventory.specificCategories || [])}`);
            }
        });

        console.log('\n' + '='.repeat(80));
        console.log('\n📋 Summary:');
        console.log(`   Total: ${banners.length}`);
        console.log(`   Active: ${banners.filter(b => b.isActive).length}`);
        console.log(`   Inactive: ${banners.filter(b => !b.isActive).length}`);
        console.log(`   Sidebar: ${banners.filter(b => b.type === 'sidebar').length}`);
        console.log(`   Footer: ${banners.filter(b => b.type === 'footer').length}`);
        console.log(`   Popup: ${banners.filter(b => b.type === 'popup').length}`);

        // Check for sidebar banners with 'home' page
        console.log('\n🏠 Sidebar banners with "home" page:');
        const homeSidebarBanners = banners.filter(b =>
            b.type === 'sidebar' &&
            b.isActive &&
            b.pages &&
            b.pages.includes('home')
        );
        console.log(`   Found: ${homeSidebarBanners.length}`);
        homeSidebarBanners.forEach(b => {
            console.log(`   - ${b.title} (${b._id})`);
            console.log(`     Pages: ${JSON.stringify(b.pages)}`);
        });

        // Check for sidebar banners with 'skincare' page
        console.log('\n🧴 Sidebar banners with "skincare" page:');
        const skincareSidebarBanners = banners.filter(b =>
            b.type === 'sidebar' &&
            b.isActive &&
            b.pages &&
            b.pages.includes('skincare')
        );
        console.log(`   Found: ${skincareSidebarBanners.length}`);
        skincareSidebarBanners.forEach(b => {
            console.log(`   - ${b.title} (${b._id})`);
            console.log(`     Pages: ${JSON.stringify(b.pages)}`);
        });

    } catch (error) {
        console.error('❌ Error checking banners:', error);
    }
};

const main = async () => {
    await connectDB();
    await checkBanners();
    process.exit(0);
};

main();
