const Order = require('../models/order.model');
const Product = require('../models/product.model');
const { buildOrderSearchFilter, searchUsers, buildPagination } = require('../utils/search');
const {
    sendOrderConfirmationEmail,
    sendOrderStatusEmail,
    sendOrderTrackingEmail,
    sendOrderCancellationEmail,
    sendReturnRequestEmail,
    sendReturnApprovedEmail,
    sendReturnRejectedEmail,
    sendReturnRefundEmail
} = require('../utils/emailHelpers');

// Get user's orders
const getUserOrders = async (req, res, next) => {
    try {
        const { page = 1, limit = 10, status } = req.query;
        const userId = req.user._id;

        const filter = { user: userId };
        if (status) filter.status = status;

        const orders = await Order.find(filter)
            .populate('items.product', 'title slug price images returnPolicy')
            .populate('statusHistory.changedBy', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(filter);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single order by ID
const getOrderById = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId })
            .populate('items.product', 'title slug price images sku returnPolicy')
            .populate('shippingAddress')
            .populate('user', 'name email')
            .populate('statusHistory.changedBy', 'name email')
            .populate('return.requestedBy', 'name email')
            .populate('return.approvedBy', 'name email')
            .populate('return.rejectedBy', 'name email')
            .populate('cancellation.cancelledBy', 'name email');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Cancel order (only if pending or confirmed)
const cancelOrder = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (!['pending', 'confirmed'].includes(order.status)) {
            return res.status(400).json({
                success: false,
                message: 'Order cannot be cancelled at this stage'
            });
        }

        order.status = 'cancelled';
        order.cancellation = {
            reason: reason || 'Cancelled by customer',
            cancelledAt: new Date(),
            cancelledBy: userId
        };

        // Restore product stock
        for (const item of order.items) {
            await Product.findByIdAndUpdate(
                item.product,
                { $inc: { stock: item.quantity } }
            );
        }

        await order.save();

        // Populate order for email
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email')
            .populate('items.product', 'name');

        // Send cancellation email
        await sendOrderCancellationEmail(populatedOrder, reason);

        res.json({
            success: true,
            message: 'Order cancelled successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Request return/refund
const requestReturn = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { reason, items, bankDetails } = req.body;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (order.status !== 'delivered') {
            return res.status(400).json({
                success: false,
                message: 'Returns can only be requested for delivered orders'
            });
        }

        // Check if return window is still open (e.g., 30 days)
        const deliveryDate = order.delivery?.deliveredAt || order.updatedAt;
        const returnWindow = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

        if (Date.now() - deliveryDate.getTime() > returnWindow) {
            return res.status(400).json({
                success: false,
                message: 'Return window has expired'
            });
        }

        // For COD orders, bank details are required
        if (order.payment.method === 'cod' && !bankDetails) {
            return res.status(400).json({
                success: false,
                message: 'Bank details are required for COD order returns'
            });
        }

        // Validate bank details for COD orders (US Banking)
        if (order.payment.method === 'cod' && bankDetails) {
            const { accountHolderName, accountNumber, routingNumber, bankName, accountType } = bankDetails;

            if (!accountHolderName || !accountNumber || !routingNumber || !bankName || !accountType) {
                return res.status(400).json({
                    success: false,
                    message: 'All bank details fields are required for COD returns'
                });
            }

            if (!['checking', 'savings'].includes(accountType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Account type must be either checking or savings'
                });
            }

            // Validate routing number format (9 digits)
            if (!/^\d{9}$/.test(routingNumber)) {
                return res.status(400).json({
                    success: false,
                    message: 'Routing number must be 9 digits'
                });
            }
        }

        order.return = {
            status: 'requested',
            reason,
            items: items || order.items.map(item => ({
                product: item.product,
                quantity: item.quantity,
                reason: reason
            })),
            requestedAt: new Date(),
            requestedBy: userId,
            bankDetails: order.payment.method === 'cod' ? bankDetails : undefined
        };

        await order.save();

        // Populate order for email
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email')
            .populate('items.product', 'name');

        // Send return request email
        await sendReturnRequestEmail(populatedOrder, order.return);

        res.json({
            success: true,
            message: 'Return request submitted successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Cancel return request (only if not yet approved)
const cancelReturnRequest = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const userId = req.user._id;

        const order = await Order.findOne({ _id: orderId, user: userId });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (!order.return || !order.return.status) {
            return res.status(400).json({
                success: false,
                message: 'No return request found for this order'
            });
        }

        if (order.return.status !== 'requested') {
            return res.status(400).json({
                success: false,
                message: `Cannot cancel return request. Current status: ${order.return.status}`
            });
        }

        // Remove the return request
        order.return = undefined;

        await order.save();

        res.json({
            success: true,
            message: 'Return request cancelled successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// ADMIN CONTROLLERS

// Get all orders (Admin)
const getAllOrders = async (req, res, next) => {
    try {
        const {
            page = 1,
            limit = 10,
            status,
            search,
            startDate,
            endDate,
            sort = '-createdAt'
        } = req.query;

        const filter = {};

        if (status) filter.status = status;

        if (search) {
            filter.$or = [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'user.email': { $regex: search, $options: 'i' } }
            ];
        }

        if (startDate || endDate) {
            filter.createdAt = {};
            if (startDate) filter.createdAt.$gte = new Date(startDate);
            if (endDate) filter.createdAt.$lte = new Date(endDate);
        }

        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('items.product', 'title sku price returnPolicy')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Order.countDocuments(filter);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        next(error);
    }
};

// Get single order (Admin)
const getOrderByIdAdmin = async (req, res, next) => {
    try {
        const { orderId } = req.params;

        const order = await Order.findById(orderId)
            .populate('user', 'name email phone')
            .populate('items.product', 'title slug price images sku returnPolicy')
            .populate('shippingAddress');

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Update order status (Admin)
const updateOrderStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status, notes, trackingNumber } = req.body;

        const validStatuses = [
            'pending', 'confirmed', 'processing', 'shipped',
            'delivered', 'cancelled', 'returned', 'refunded', 'failed'
        ];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid order status'
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        const oldStatus = order.status;
        order.status = status;

        // Update specific status timestamps and data
        switch (status) {
            case 'confirmed':
                order.confirmedAt = new Date();
                break;
            case 'processing':
                order.processing = {
                    startedAt: new Date(),
                    notes
                };
                break;
            case 'shipped':
                order.shipping = {
                    shippedAt: new Date(),
                    trackingNumber,
                    notes
                };
                break;
            case 'delivered':
                order.delivery = {
                    deliveredAt: new Date(),
                    notes
                };
                break;
            case 'cancelled':
                order.cancellation = {
                    reason: notes || 'Cancelled by admin',
                    cancelledAt: new Date(),
                    cancelledBy: req.user._id
                };
                // Restore stock if cancelled
                for (const item of order.items) {
                    await Product.findByIdAndUpdate(
                        item.product,
                        { $inc: { stock: item.quantity } }
                    );
                }
                break;
        }

        // Add status history
        order.statusHistory.push({
            status: oldStatus,
            changedTo: status,
            changedAt: new Date(),
            changedBy: req.user._id,
            notes
        });

        await order.save();

        // Populate user data for email
        await order.populate('user', 'name email');

        // Send status update email (async, don't wait)
        sendOrderStatusEmail(order, oldStatus, status).catch(err =>
            console.error('Order status email failed:', err)
        );

        // Send tracking email if order is shipped
        if (status === 'shipped' && trackingNumber) {
            sendOrderTrackingEmail(order).catch(err =>
                console.error('Order tracking email failed:', err)
            );
        }

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Handle return request (Admin)
const handleReturnRequest = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { action, notes, refundAmount } = req.body; // action: 'approve' | 'reject'

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        if (!order.return || order.return.status !== 'requested') {
            return res.status(400).json({
                success: false,
                message: 'No pending return request found'
            });
        }

        if (action === 'approve') {
            order.return.status = 'approved';
            order.return.approvedAt = new Date();
            order.return.approvedBy = req.user._id;
            order.return.notes = notes;

            if (refundAmount) {
                order.return.refundAmount = refundAmount;
            }

            // Populate order for email
            const populatedOrder = await Order.findById(order._id)
                .populate('user', 'name email')
                .populate('items.product', 'name');

            // Send approval email
            await sendReturnApprovedEmail(populatedOrder, order.return);
        } else if (action === 'reject') {
            order.return.status = 'rejected';
            order.return.rejectedAt = new Date();
            order.return.rejectedBy = req.user._id;
            order.return.notes = notes;

            // Populate order for email
            const populatedOrder = await Order.findById(order._id)
                .populate('user', 'name email')
                .populate('items.product', 'name');

            // Send rejection email
            await sendReturnRejectedEmail(populatedOrder, order.return, notes);
        }

        await order.save();

        res.json({
            success: true,
            message: `Return request ${action}d successfully`,
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Process refund (Admin)
const processRefund = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { amount, reason, method } = req.body;

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        let refundStatus = 'completed';
        let stripeRefundId = null;

        // Process Stripe refund for prepaid orders
        if (order.payment.method === 'stripe' && order.payment.paymentIntentId) {
            try {
                const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

                // Create refund in Stripe
                const refund = await stripe.refunds.create({
                    payment_intent: order.payment.paymentIntentId,
                    amount: Math.round(amount * 100), // Convert to cents
                    reason: 'requested_by_customer',
                    metadata: {
                        orderId: order._id.toString(),
                        orderNumber: order.orderNumber
                    }
                });

                stripeRefundId = refund.id;
                refundStatus = refund.status === 'succeeded' ? 'completed' : 'pending';

                console.log(`✅ Stripe refund created: ${refund.id} for order ${order.orderNumber}`);
            } catch (stripeError) {
                console.error('Stripe refund error:', stripeError);
                return res.status(500).json({
                    success: false,
                    message: `Failed to process Stripe refund: ${stripeError.message}`
                });
            }
        }

        // Add refund record
        order.refunds.push({
            amount,
            reason,
            method: method || order.payment.method, // Use order's payment method
            processedAt: new Date(),
            processedBy: req.user._id,
            status: refundStatus,
            stripeRefundId
        });

        // Update return status if this is a return refund
        if (order.return && order.return.status === 'approved') {
            order.return.status = 'refunded';
            order.return.refundedAt = new Date();
        }

        // Don't change status to 'refunded' if order is already cancelled
        // Keep it as 'cancelled' so it shows in cancelled orders tab
        // Only change to 'refunded' if order was in a different status (like returned)
        const totalRefunded = order.refunds.reduce((sum, refund) => sum + refund.amount, 0);
        if (totalRefunded >= order.total && order.status !== 'cancelled') {
            order.status = 'refunded';
        }

        await order.save();

        // If this is a return refund, send email
        if (order.return && order.return.status === 'refunded') {
            const populatedOrder = await Order.findById(order._id)
                .populate('user', 'name email')
                .populate('items.product', 'name');

            await sendReturnRefundEmail(populatedOrder, order.return);
        }

        res.json({
            success: true,
            message: order.payment.method === 'stripe'
                ? 'Stripe refund processed successfully'
                : 'Refund recorded successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Mark order as failed (used by payment system)
const markOrderFailed = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { reason } = req.body;

        const order = await Order.findByIdAndUpdate(
            orderId,
            {
                status: 'failed',
                'payment.status': 'failed',
                'payment.failedAt': new Date(),
                'payment.failureReason': reason || 'Payment failed'
            },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Order marked as failed',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// Get order statistics (Admin)
const getOrderStats = async (req, res, next) => {
    try {
        const { period = '30d' } = req.query;

        let startDate;
        switch (period) {
            case '7d':
                startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                break;
            case '30d':
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                break;
            case '90d':
                startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
                break;
            default:
                startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        }

        const stats = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$total' },
                    averageOrderValue: { $avg: '$total' },
                    pendingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
                    },
                    confirmedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'confirmed'] }, 1, 0] }
                    },
                    processingOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
                    },
                    shippedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
                    },
                    deliveredOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
                    },
                    cancelledOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
                    },
                    failedOrders: {
                        $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
                    }
                }
            }
        ]);

        const result = stats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            pendingOrders: 0,
            confirmedOrders: 0,
            processingOrders: 0,
            shippedOrders: 0,
            deliveredOrders: 0,
            cancelledOrders: 0,
            failedOrders: 0
        };

        res.json({
            success: true,
            data: {
                period,
                stats: result
            }
        });
    } catch (error) {
        next(error);
    }
};

// Search orders (Admin)
const searchOrdersAdmin = async (req, res, next) => {
    try {
        const {
            q, // search query
            page = 1,
            limit = 20,
            status,
            startDate,
            endDate,
            sort = '-createdAt'
        } = req.query;

        if (!q || q.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Search query is required'
            });
        }

        const skip = (page - 1) * limit;

        // Search for matching users first
        const User = require('../models/user.model');
        const userIds = await searchUsers(q, User);

        // Build search filter using utility
        const filter = buildOrderSearchFilter(q, userIds, {
            status,
            startDate,
            endDate
        });

        const orders = await Order.find(filter)
            .populate('user', 'name email phone')
            .populate('items.product', 'title sku price images returnPolicy')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Order.countDocuments(filter);
        const pagination = buildPagination(page, limit, total);

        res.json({
            success: true,
            data: {
                orders,
                searchQuery: q,
                pagination: {
                    ...pagination,
                    totalOrders: total
                }
            }
        });
    } catch (error) {
        console.error('Admin search orders error:', error);
        next(error);
    }
};

// Update payment status (Admin)
const updatePaymentStatus = async (req, res, next) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['pending', 'completed', 'failed'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid payment status'
            });
        }

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        // Update payment status
        order.payment.status = status;

        if (status === 'completed') {
            order.payment.paidAt = new Date();
        } else if (status === 'failed') {
            order.payment.failedAt = new Date();
        }

        await order.save();

        res.json({
            success: true,
            message: 'Payment status updated successfully',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    // User endpoints
    getUserOrders,
    getOrderById,
    cancelOrder,
    requestReturn,
    cancelReturnRequest,

    // Admin endpoints
    getAllOrders,
    getOrderByIdAdmin,
    updateOrderStatus,
    updatePaymentStatus,
    handleReturnRequest,
    processRefund,
    getOrderStats,
    markOrderFailed,
    searchOrdersAdmin
};