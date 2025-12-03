const Banner = require('../models/banner.model');

// Get all banners (Admin)
const getAllBanners = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, isActive } = req.query;

        const filter = {};
        if (type) filter.type = type;
        if (isActive !== undefined) filter.isActive = isActive === 'true';

        const banners = await Banner.find(filter)
            .sort({ position: 1, createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Banner.countDocuments(filter);

        res.json({
            success: true,
            data: banners,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get all banners error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banners'
        });
    }
};

// Get active banners (Public) - with client context for trigger evaluation
const getActiveBanners = async (req, res) => {
    try {
        const { type, page, deviceType, userType, isLoggedIn, categoryId, productId } = req.query;

        console.log('🎯 GET /banners/active - Query params:', { type, page, deviceType, userType, isLoggedIn, categoryId });

        let banners;
        if (page) {
            // Get banners for specific page OR global banners (empty pages array)
            console.log(`📄 Fetching banners for page: "${page}", type: "${type}"`);

            const now = new Date();
            const query = {
                isActive: true,
                startDate: { $lte: now },
                $and: [
                    {
                        $or: [
                            { endDate: { $exists: false } },
                            { endDate: null },
                            { endDate: { $gte: now } }
                        ]
                    },
                    {
                        // Match either: page in pages array OR pages array is empty (global)
                        $or: [
                            { pages: page },
                            { pages: { $size: 0 } },
                            { pages: { $exists: false } }
                        ]
                    }
                ]
            };

            if (type) {
                query.type = type;
            }

            banners = await Banner.find(query).sort({ createdAt: -1 });
            console.log(`📦 Found ${banners.length} banners for page "${page}" (including global)`);
            if (banners.length > 0) {
                console.log('📋 Banner pages:', banners.map(b => ({
                    id: b._id,
                    title: b.title,
                    pages: b.pages,
                    type: b.type,
                    isGlobal: !b.pages || b.pages.length === 0
                })));
            }
        } else {
            // Get all active banners
            console.log(`📄 Fetching all active banners, type: "${type}"`);
            banners = await Banner.getActiveBanners(type);
            console.log(`📦 Found ${banners.length} active banners`);
        }

        // Filter banners based on triggers (server-side pre-filtering)
        console.log('🔍 Filtering banners based on triggers...');
        const filteredBanners = banners.filter(banner => {
            console.log(`  🎨 Checking banner: "${banner.title}" (${banner._id})`);

            // Device trigger check
            if (banner.triggers?.device?.enabled && deviceType) {
                console.log(`    📱 Device trigger enabled. Checking ${deviceType} in`, banner.triggers.device.types);
                if (!banner.triggers.device.types.includes(deviceType)) {
                    console.log(`    ❌ Device ${deviceType} not in allowed list`);
                    return false;
                }
                console.log(`    ✅ Device check passed`);
            } else {
                console.log(`    📱 Device trigger disabled or no deviceType provided`);
            }

            // User type trigger check
            if (banner.triggers?.userType?.enabled) {
                const userTypes = banner.triggers.userType.types;
                console.log(`    👤 User type trigger enabled. Checking types:`, userTypes);

                // Check logged-in status
                if (userTypes.includes('logged-in') && isLoggedIn !== 'true') {
                    console.log(`    ❌ Requires logged-in but user is guest`);
                    return false;
                }
                if (userTypes.includes('guest') && isLoggedIn === 'true') {
                    console.log(`    ❌ Requires guest but user is logged-in`);
                    return false;
                }
                console.log(`    ✅ User type check passed`);
            } else {
                console.log(`    👤 User type trigger disabled`);
            }

            // Inventory trigger check (for product pages)
            if (banner.triggers?.inventory?.enabled) {
                console.log(`    📦 Inventory trigger enabled`);

                // If inventory trigger is enabled but we're not on a product page, skip this banner
                if (!categoryId && !productId) {
                    // Check if any inventory conditions are set
                    const hasInventoryConditions =
                        banner.triggers.inventory.outOfStock ||
                        banner.triggers.inventory.codAvailable ||
                        (banner.triggers.inventory.specificCategories && banner.triggers.inventory.specificCategories.length > 0);

                    if (hasInventoryConditions) {
                        console.log(`    ❌ Inventory trigger requires product data but none provided`);
                        return false;
                    }
                }

                // Check category if provided
                if (categoryId && banner.triggers.inventory.specificCategories && banner.triggers.inventory.specificCategories.length > 0) {
                    console.log(`    📦 Checking category ${categoryId}`);
                    const categoryMatch = banner.triggers.inventory.specificCategories.some(
                        cat => cat.toString() === categoryId
                    );
                    if (!categoryMatch) {
                        console.log(`    ❌ Category ${categoryId} not in allowed list`);
                        return false;
                    }
                    console.log(`    ✅ Category check passed`);
                }
            } else {
                console.log(`    📦 Inventory trigger disabled`);
            }

            console.log(`  ✅ Banner "${banner.title}" passed all filters`);
            return true;
        });

        console.log(`✅ Returning ${filteredBanners.length} filtered banners`);
        res.json({
            success: true,
            data: filteredBanners
        });
    } catch (error) {
        console.error('Get active banners error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch active banners'
        });
    }
};

// Get banner by ID
const getBannerById = async (req, res) => {
    try {
        const { id } = req.params;
        const banner = await Banner.findById(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            data: banner
        });
    } catch (error) {
        console.error('Get banner by ID error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch banner'
        });
    }
};

// Create banner (Admin)
const createBanner = async (req, res) => {
    try {
        const bannerData = req.body;

        // Validate required fields
        if (!bannerData.title || !bannerData.image?.url) {
            return res.status(400).json({
                success: false,
                message: 'Title and image are required'
            });
        }

        // Validate pages based on banner type and triggers
        // If no triggers are enabled, require page selection
        const hasAnyTrigger = bannerData.triggers && (
            bannerData.triggers.device?.enabled ||
            bannerData.triggers.behavior?.enabled ||
            bannerData.triggers.userType?.enabled ||
            bannerData.triggers.inventory?.enabled
        );

        // All banner types now require page selection if no triggers
        if (!hasAnyTrigger) {
            if (!bannerData.pages || bannerData.pages.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one page must be selected, or enable triggers'
                });
            }
        }

        // Duplicate validation removed - multiple banners allowed per page

        const banner = await Banner.create(bannerData);

        res.status(201).json({
            success: true,
            message: 'Banner created successfully',
            data: banner
        });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create banner'
        });
    }
};

// Update banner (Admin)
const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        console.log('🔄 UPDATE BANNER REQUEST:', {
            id,
            updates: {
                type: updates.type,
                pages: updates.pages,
                isActive: updates.isActive,
                triggers: updates.triggers
            }
        });

        // Get current banner to check type
        const currentBanner = await Banner.findById(id);
        if (!currentBanner) {
            console.log('❌ Banner not found:', id);
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        console.log('📋 Current banner:', {
            type: currentBanner.type,
            pages: currentBanner.pages,
            isActive: currentBanner.isActive
        });

        // Determine the final type (use update type if provided, otherwise keep current)
        const finalType = updates.type || currentBanner.type;
        const finalPages = updates.pages !== undefined ? updates.pages : currentBanner.pages;
        const finalTriggers = updates.triggers || currentBanner.triggers;

        // Check if any triggers are enabled
        const hasAnyTrigger = finalTriggers && (
            finalTriggers.device?.enabled ||
            finalTriggers.behavior?.enabled ||
            finalTriggers.userType?.enabled ||
            finalTriggers.inventory?.enabled
        );

        // Validate pages based on banner type and triggers
        console.log('🔍 Validation check:', {
            finalType,
            hasAnyTrigger,
            finalPages,
            finalPagesLength: finalPages?.length
        });

        if (finalType !== 'popup' && !hasAnyTrigger) {
            // Footer and sidebar banners require at least one page if no triggers
            if (!finalPages || finalPages.length === 0) {
                console.log('❌ Validation failed: No pages selected for non-popup banner');
                return res.status(400).json({
                    success: false,
                    message: 'At least one page must be selected for footer and sidebar banners, or enable triggers'
                });
            }
        }

        // Duplicate validation removed - multiple banners allowed per page

        console.log('✅ All validations passed, updating banner...');

        const banner = await Banner.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: false } // Disable mongoose validators, we handle it above
        );

        console.log('✅ Banner updated successfully:', banner.title);

        res.json({
            success: true,
            message: 'Banner updated successfully',
            data: banner
        });
    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to update banner'
        });
    }
};

// Delete banner (Admin)
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await Banner.findByIdAndDelete(id);

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete banner'
        });
    }
};

// Toggle banner status (Admin)
const toggleBannerStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;

        const banner = await Banner.findByIdAndUpdate(
            id,
            { isActive },
            { new: true }
        );

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        res.json({
            success: true,
            message: `Banner ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: banner
        });
    } catch (error) {
        console.error('Toggle banner status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to toggle banner status'
        });
    }
};

// Track banner view (Public)
const trackBannerView = async (req, res) => {
    try {
        const { id } = req.params;

        await Banner.findByIdAndUpdate(id, {
            $inc: { viewCount: 1 }
        });

        res.json({
            success: true,
            message: 'View tracked'
        });
    } catch (error) {
        console.error('Track banner view error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track view'
        });
    }
};

// Track banner click (Public)
const trackBannerClick = async (req, res) => {
    try {
        const { id } = req.params;

        await Banner.findByIdAndUpdate(id, {
            $inc: { clickCount: 1 }
        });

        res.json({
            success: true,
            message: 'Click tracked'
        });
    } catch (error) {
        console.error('Track banner click error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to track click'
        });
    }
};

// Get occupied pages by banner type (Admin) - DEPRECATED, multiple banners allowed
const getOccupiedPages = async (req, res) => {
    try {
        // Return empty array since multiple banners are now allowed per page
        res.json({
            success: true,
            data: []
        });
    } catch (error) {
        console.error('Get occupied pages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get occupied pages'
        });
    }
};

// Get banners for specific pages (Admin)
const getBannersByPages = async (req, res) => {
    try {
        const { pages, type, excludeBannerId } = req.query;

        if (!pages) {
            return res.status(400).json({
                success: false,
                message: 'Pages parameter is required'
            });
        }

        const pagesArray = pages.split(',').map(p => p.trim());
        
        const query = {
            pages: { $in: pagesArray },
            isActive: true
        };

        if (type) {
            query.type = type;
        }

        // Exclude current banner when editing
        if (excludeBannerId) {
            query._id = { $ne: excludeBannerId };
        }

        const banners = await Banner.find(query)
            .select('title type pages image')
            .sort({ createdAt: -1 });

        // Group banners by page
        const bannersByPage = {};
        pagesArray.forEach(page => {
            bannersByPage[page] = banners.filter(b => b.pages.includes(page));
        });

        res.json({
            success: true,
            data: bannersByPage
        });
    } catch (error) {
        console.error('Get banners by pages error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get banners'
        });
    }
};

module.exports = {
    getAllBanners,
    getActiveBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    trackBannerView,
    trackBannerClick,
    getOccupiedPages,
    getBannersByPages
};
