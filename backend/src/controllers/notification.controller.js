const Order = require('../models/order.model');
const User = require('../models/user.model');

/**
 * Get notification counts for admin dashboard
 * @route GET /api/admin/notifications/counts
 * @access Private (Admin only)
 */
const getNotificationCounts = async (req, res, next) => {
    try {
        const now = new Date();
        const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Count new users (registered in last 24 hours)
        const newUsersCount = await User.countDocuments({
            createdAt: { $gte: last24Hours },
            role: { $ne: 'admin' } // Exclude admin users
        });

        // Count new orders (pending or confirmed status)
        const newOrdersCount = await Order.countDocuments({
            status: { $in: ['pending', 'confirmed'] }
        });

        // Count new return requests (status: requested)
        const newReturnsCount = await Order.countDocuments({
            'return.status': 'requested'
        });

        // Count new cancellations (cancelled without refund)
        const newCancellationsCount = await Order.countDocuments({
            status: 'cancelled',
            $or: [
                { refunds: { $size: 0 } },
                { refunds: { $exists: false } },
                { 'refunds.status': { $ne: 'completed' } }
            ]
        });

        const totalCount = newUsersCount + newOrdersCount + newReturnsCount + newCancellationsCount;

        res.json({
            success: true,
            data: {
                newUsers: newUsersCount,
                newOrders: newOrdersCount,
                newReturns: newReturnsCount,
                newCancellations: newCancellationsCount,
                total: totalCount
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getNotificationCounts
};
