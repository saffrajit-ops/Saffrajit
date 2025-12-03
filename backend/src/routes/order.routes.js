const express = require('express');
const router = express.Router();
const {
  getUserOrders,
  getOrderById,
  cancelOrder,
  requestReturn,
  cancelReturnRequest,
  getAllOrders,
  getOrderByIdAdmin,
  updateOrderStatus,
  updatePaymentStatus,
  handleReturnRequest,
  processRefund,
  getOrderStats,
  markOrderFailed
} = require('../controllers/order.controller');
const { authenticate, authorize } = require('../middlewares/auth');

// Admin routes (require admin role) - Define these FIRST to avoid conflicts with /:orderId
router.get('/admin/orders/search', authenticate, authorize('admin'), require('../controllers/order.controller').searchOrdersAdmin);
router.get('/admin/stats', authenticate, authorize('admin'), getOrderStats);
router.get('/admin/orders/:orderId', authenticate, authorize('admin'), getOrderByIdAdmin);
router.get('/admin/orders', authenticate, authorize('admin'), getAllOrders);
router.put('/admin/orders/:orderId/status', authenticate, authorize('admin'), updateOrderStatus);
router.put('/admin/orders/:orderId/payment-status', authenticate, authorize('admin'), updatePaymentStatus);
router.put('/admin/orders/:orderId/return', authenticate, authorize('admin'), handleReturnRequest);
router.post('/admin/orders/:orderId/refund', authenticate, authorize('admin'), processRefund);
router.put('/admin/orders/:orderId/failed', authenticate, authorize('admin'), markOrderFailed);

// User routes (require authentication) - These come AFTER admin routes
router.get('/', authenticate, getUserOrders);
router.get('/:orderId', authenticate, getOrderById);
router.put('/:orderId/cancel', authenticate, cancelOrder);
router.post('/:orderId/return', authenticate, requestReturn);
router.delete('/:orderId/return', authenticate, cancelReturnRequest);

module.exports = router;