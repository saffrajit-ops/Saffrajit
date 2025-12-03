'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { orderAPI } from '@/lib/api/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Input } from '@/components/ui/input';
import { Download, Search, Package, RotateCcw, X, MapPin, CreditCard, Truck, Calendar, AlertCircle, Star, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';
import OrderProgressBar from '@/components/order/OrderProgressBar';
import { generateInvoicePDF } from '@/lib/utils/invoice-pdf';
import { useAuthStore } from '@/lib/auth-store';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

interface Order {
  _id: string;
  orderNumber: string;
  items: any[];
  status: string;
  total: number;
  subtotal: number;
  discount?: number;
  shippingCharges?: number;
  confirmedAt?: string;
  processing?: any;
  shipping?: any;
  delivery?: any;
  cancellation?: any;
  return?: any;
  refunds?: any[];
  coupon?: any;
  payment?: any;
  shippingAddress?: any;
  createdAt: string;
  updatedAt: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [cancelOrderDialog, setCancelOrderDialog] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null
  });
  const [returnOrderDialog, setReturnOrderDialog] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null
  });
  const [cancelReturnDialog, setCancelReturnDialog] = useState<{ open: boolean; orderId: string | null }>({
    open: false,
    orderId: null
  });
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    orderId: string | null;
    productId: string | null;
    productTitle: string;
  }>({
    open: false,
    orderId: null,
    productId: null,
    productTitle: ''
  });
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [orderReviews, setOrderReviews] = useState<Record<string, any[]>>({});
  const [openOrderDetails, setOpenOrderDetails] = useState<Record<string, boolean>>({});
  const [cancelReason, setCancelReason] = useState('');
  const [returnReason, setReturnReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [bankDetails, setBankDetails] = useState({
    accountHolderName: '',
    accountNumber: '',
    routingNumber: '',
    bankName: '',
    accountType: 'checking' as 'checking' | 'savings'
  });

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = orders.filter(order =>
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.title?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredOrders(filtered);
    } else {
      setFilteredOrders(orders);
    }
  }, [searchQuery, orders]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await orderAPI.getUserOrders({ limit: 50 });
      if (response.success && response.data) {
        const ordersData = Array.isArray(response.data) ? response.data : [];

        // Debug logging
        console.log('📦 Orders fetched:', ordersData.length);
        ordersData.forEach((order: Order) => {
          if (order.status.toLowerCase() === 'delivered') {
            console.log('🚚 Delivered Order Debug:', {
              orderNumber: order.orderNumber,
              status: order.status,
              hasDelivery: !!order.delivery,
              deliveredAt: order.delivery?.deliveredAt,
              hasReturn: !!order.return,
              returnObject: order.return, // Show full return object
              returnStatus: order.return?.status,
              items: order.items.map((item: any) => ({
                title: item.title,
                hasProduct: !!item.product,
                productId: item.product?._id,
                returnPolicy: item.product?.returnPolicy
              }))
            });
          }
        });

        setOrders(ordersData);
        setFilteredOrders(ordersData);

        // Fetch reviews for delivered orders
        ordersData.forEach((order: Order) => {
          if (order.status.toLowerCase() === 'delivered') {
            fetchOrderReviews(order._id);
          }
        });
      }
    } catch (error: any) {
      console.error('Failed to load orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadInvoice = (order: Order) => {
    try {
      generateInvoicePDF(order, {
        name: user?.name,
        email: user?.email,
      });
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate invoice');
    }
  };

  const handleCancelOrder = async () => {
    if (!cancelOrderDialog.orderId) return;

    try {
      setIsSaving(true);
      const response = await orderAPI.cancelOrder(cancelOrderDialog.orderId, cancelReason || undefined);

      if (response.success) {
        toast.success('Order cancelled successfully');
        setCancelOrderDialog({ open: false, orderId: null });
        setCancelReason('');
        fetchOrders();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRequestReturn = async () => {
    if (!returnOrderDialog.orderId) return;

    if (!returnReason.trim()) {
      toast.error('Please provide a reason for return');
      return;
    }

    // Find the order to check payment method
    const order = orders.find(o => o._id === returnOrderDialog.orderId);
    const isCOD = order?.payment?.method === 'cod';

    // Validate bank details for COD orders
    if (isCOD) {
      if (!bankDetails.accountHolderName || !bankDetails.accountNumber || 
          !bankDetails.routingNumber || !bankDetails.bankName) {
        toast.error('Please fill in all bank details for COD refund');
        return;
      }
      
      // Validate routing number format (9 digits)
      if (!/^\d{9}$/.test(bankDetails.routingNumber)) {
        toast.error('Routing number must be exactly 9 digits');
        return;
      }
    }

    try {
      setIsSaving(true);
      const response = await orderAPI.requestReturn(
        returnOrderDialog.orderId, 
        returnReason,
        isCOD ? bankDetails : undefined
      );

      if (response.success) {
        toast.success('Return request submitted successfully');
        setReturnOrderDialog({ open: false, orderId: null });
        setReturnReason('');
        setBankDetails({
          accountHolderName: '',
          accountNumber: '',
          routingNumber: '',
          bankName: '',
          accountType: 'checking'
        });
        fetchOrders();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit return request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelReturnRequest = async () => {
    if (!cancelReturnDialog.orderId) return;

    try {
      setIsSaving(true);
      const response = await orderAPI.cancelReturnRequest(cancelReturnDialog.orderId);

      if (response.success) {
        toast.success('Return request cancelled successfully');
        setCancelReturnDialog({ open: false, orderId: null });
        fetchOrders();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel return request');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!reviewDialog.orderId || !reviewDialog.productId) return;

    if (reviewRating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setIsSaving(true);
      const response = await orderAPI.createReview(
        reviewDialog.orderId,
        reviewDialog.productId,
        reviewRating,
        reviewComment
      );

      if (response.success) {
        toast.success('Review submitted successfully');
        setReviewDialog({ open: false, orderId: null, productId: null, productTitle: '' });
        setReviewRating(0);
        setReviewComment('');
        // Refresh reviews for this order
        if (reviewDialog.orderId) {
          fetchOrderReviews(reviewDialog.orderId);
        }
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setIsSaving(false);
    }
  };

  const fetchOrderReviews = async (orderId: string) => {
    try {
      const response = await orderAPI.getOrderReviews(orderId);
      if (response.success) {
        setOrderReviews(prev => ({
          ...prev,
          [orderId]: response.data
        }));
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    }
  };

  const hasReviewedProduct = (orderId: string, productId: string) => {
    const reviews = orderReviews[orderId] || [];
    return reviews.some(review => review.product._id === productId || review.product === productId);
  };

  const canCancelOrder = (order: Order) => {
    if (order.return?.status && ['approved', 'completed'].includes(order.return.status.toLowerCase())) {
      return false;
    }
    return ['pending', 'confirmed'].includes(order.status.toLowerCase());
  };

  const canRequestReturn = (order: Order) => {
    console.log(`🔍 Checking return eligibility for ${order.orderNumber}`);

    // Can't return if not delivered
    if (order.status.toLowerCase() !== 'delivered') {
      console.log(`❌ Not delivered (status: ${order.status})`);
      return false;
    }
    console.log('✅ Status is delivered');

    // Can't return if already has a valid return request
    // Only block if return object exists AND has a valid status
    if (order.return && order.return.status) {
      console.log(`❌ Already has return request (status: ${order.return.status})`);
      return false;
    }
    console.log('✅ No existing return request (or return status is undefined)');

    // Must have delivery date
    if (!order.delivery?.deliveredAt) {
      console.log('❌ No delivery date');
      return false;
    }
    console.log(`✅ Has delivery date: ${order.delivery.deliveredAt}`);

    // Check if within return window (30 days default)
    const deliveryDate = new Date(order.delivery.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`📅 Days since delivery: ${daysSinceDelivery}`);

    // Check if we have product data with returnPolicy
    const hasProductData = order.items.some(item => item.product);
    console.log(`📦 Has product data: ${hasProductData}`);

    if (hasProductData) {
      // Check if all products are explicitly non-returnable
      const allNonReturnable = order.items.every(item =>
        item.product?.returnPolicy?.returnable === false
      );
      console.log(`🚫 All non-returnable: ${allNonReturnable}`);

      if (allNonReturnable) {
        console.log('❌ All products are non-returnable');
        return false;
      }

      // Get the maximum return window from products
      const returnWindows = order.items
        .filter(item => item.product?.returnPolicy?.returnable !== false)
        .map(item => item.product?.returnPolicy?.returnWindowDays || 30);

      console.log(`⏰ Return windows: ${JSON.stringify(returnWindows)}`);

      const maxReturnWindow = returnWindows.length > 0 ? Math.max(...returnWindows) : 30;
      console.log(`⏰ Max return window: ${maxReturnWindow} days`);

      const canReturn = daysSinceDelivery <= maxReturnWindow;
      console.log(`${canReturn ? '✅' : '❌'} Within return window: ${canReturn}`);
      return canReturn;
    }

    // If no product data, use default 30-day window
    const canReturn = daysSinceDelivery <= 30;
    console.log(`${canReturn ? '✅' : '❌'} Using default 30-day window: ${canReturn}`);
    return canReturn;
  };

  const getReturnableItems = (order: Order) => {
    if (!order.delivery?.deliveredAt) return [];

    const deliveryDate = new Date(order.delivery.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

    return order.items.filter(item => {
      const returnPolicy = item.product?.returnPolicy;

      // If explicitly set to non-returnable
      if (returnPolicy?.returnable === false) {
        return false;
      }

      // If no product data or no returnPolicy, default to returnable with 30 days window
      const returnWindow = returnPolicy?.returnWindowDays || 30;
      return daysSinceDelivery <= returnWindow;
    });
  };

  const getReturnWindowInfo = (order: Order) => {
    if (!order.delivery?.deliveredAt) return null;

    const deliveryDate = new Date(order.delivery.deliveredAt);
    const now = new Date();
    const daysSinceDelivery = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));

    const returnableItems = getReturnableItems(order);
    if (returnableItems.length === 0) return null;

    const maxReturnWindow = Math.max(...returnableItems.map(item =>
      item.product?.returnPolicy?.returnWindowDays || 30
    ));

    const daysRemaining = maxReturnWindow - daysSinceDelivery;

    return {
      daysRemaining,
      maxReturnWindow,
      daysSinceDelivery
    };
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-500';
      case 'shipped':
        return 'bg-blue-500';
      case 'processing':
      case 'confirmed':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      case 'pending':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
        <p className="text-sm text-gray-600 mt-1">
          View and manage your orders ({filteredOrders.length} orders)
        </p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            type="text"
            placeholder="Search by order number or product name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card className="p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No orders found' : 'No orders yet'}
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            {searchQuery ? 'Try a different search term' : 'Start shopping to see your orders here'}
          </p>
          {!searchQuery && (
            <Button onClick={() => router.push('/skincare')}>
              Start Shopping
            </Button>
          )}
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const returnWindowInfo = getReturnWindowInfo(order);
            const returnableItems = getReturnableItems(order);

            return (
              <Card key={order._id} className="overflow-hidden">
                <div className="p-6 space-y-6">
                  {/* Order Header */}
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-semibold text-gray-900">{order.orderNumber}</h3>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status.toUpperCase()}
                        </Badge>
                        {order.return?.status && (
                          <Badge variant="outline" className="border-blue-500 text-blue-700">
                            RETURN: {order.return.status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>
                          Ordered on {new Date(order.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadInvoice(order)}
                      className="gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Invoice
                    </Button>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-900">Order Items</h4>
                    {order.items.map((item, idx) => {
                      const returnPolicy = item.product?.returnPolicy;
                      const isReturnable = !returnPolicy || returnPolicy.returnable !== false;
                      const returnWindow = returnPolicy?.returnWindowDays || 30;
                      const isWithinReturnWindow = returnableItems.some(ri =>
                        ri.product?._id === item.product?._id || ri.title === item.title
                      );

                      return (
                        <div key={idx} className="flex gap-4 p-4 bg-gray-50 rounded-lg">
                          <div className="relative w-24 h-24 flex-shrink-0 bg-white rounded-lg overflow-hidden border border-gray-200">
                            {item.product?.images?.[0]?.url ? (
                              <Image
                                src={item.product.images[0].url}
                                alt={item.title}
                                fill
                                className="object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <p className="font-medium text-gray-900">{item.title}</p>
                              <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                                <span>Quantity: {item.quantity}</span>
                                <span>×</span>
                                <span>${item.price?.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <p className="text-base font-semibold text-gray-900">
                                ${item.subtotal?.toFixed(2)}
                              </p>
                              <div className="flex items-center gap-2 flex-wrap">
                                {order.status.toLowerCase() === 'delivered' && (
                                  <>
                                    {(() => {
                                      // If no returnPolicy, default to returnable
                                      const returnPolicy = item.product?.returnPolicy;
                                      const isReturnableProduct = !returnPolicy || returnPolicy.returnable !== false;
                                      const returnWindowDays = returnPolicy?.returnWindowDays || 7;

                                      if (!isReturnableProduct) {
                                        return (
                                          <Badge variant="outline" className="border-red-400 text-red-600 text-xs">
                                            Non-returnable
                                          </Badge>
                                        );
                                      }

                                      if (isWithinReturnWindow) {
                                        return (
                                          <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                                            Returnable ({returnWindowDays} days)
                                          </Badge>
                                        );
                                      }

                                      return (
                                        <Badge variant="outline" className="border-gray-400 text-gray-600 text-xs">
                                          Return window expired
                                        </Badge>
                                      );
                                    })()}
                                    {item.product?._id && !hasReviewedProduct(order._id, item.product._id) ? (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setReviewDialog({
                                          open: true,
                                          orderId: order._id,
                                          productId: item.product._id,
                                          productTitle: item.title
                                        })}
                                        className="gap-1 text-yellow-600 border-yellow-300 hover:bg-yellow-50 text-xs h-7"
                                      >
                                        <Star className="w-3 h-3" />
                                        Write Review
                                      </Button>
                                    ) : item.product?._id && hasReviewedProduct(order._id, item.product._id) && (
                                      <Badge variant="outline" className="border-green-500 text-green-700 text-xs">
                                        ✓ Reviewed
                                      </Badge>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Order Status</h4>
                    <OrderProgressBar
                      status={order.status}
                      confirmedAt={order.confirmedAt}
                      processing={order.processing}
                      shipping={order.shipping}
                      delivery={order.delivery}
                      cancellation={order.cancellation}
                      return={order.return}
                      refunds={order.refunds}
                    />
                  </div>

                  {/* Order Details Collapsible */}
                  <Collapsible
                    open={openOrderDetails[order._id]}
                    onOpenChange={(isOpen) => setOpenOrderDetails(prev => ({ ...prev, [order._id]: isOpen }))}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-between hover:bg-gray-100">
                        <span className="font-medium">View Order Details</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${openOrderDetails[order._id] ? 'rotate-180' : ''
                            }`}
                        />
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                      {/* Shipping Address */}
                      {order.shippingAddress && (
                        <Card className="bg-gray-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              Shipping Address
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="text-sm text-gray-700">
                            {order.shippingAddress.label && (
                              <p className="font-medium mb-1">{order.shippingAddress.label}</p>
                            )}
                            <p>{order.shippingAddress.line1}</p>
                            {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                            <p>
                              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}
                            </p>
                            <p>{order.shippingAddress.country}</p>
                          </CardContent>
                        </Card>
                      )}

                      {/* Payment Information */}
                      <Card className="bg-gray-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <CreditCard className="w-4 h-4" />
                            Payment Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method</span>
                            <span className="font-medium">
                              {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Status</span>
                            <Badge variant={order.payment?.status === 'completed' ? 'default' : 'secondary'}>
                              {order.payment?.status?.toUpperCase() || 'PENDING'}
                            </Badge>
                          </div>
                          {order.payment?.paidAt && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Paid At</span>
                              <span className="font-medium">
                                {new Date(order.payment.paidAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* Tracking Information */}
                      {order.shipping?.trackingNumber && (
                        <Card className="bg-gray-50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Tracking Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tracking Number</span>
                              <span className="font-mono font-medium">{order.shipping.trackingNumber}</span>
                            </div>
                            {order.shipping.shippedAt && (
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shipped At</span>
                                <span className="font-medium">
                                  {new Date(order.shipping.shippedAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            )}
                            {order.shipping.notes && (
                              <div className="pt-2 border-t">
                                <span className="text-gray-600 block mb-1">Shipping Notes</span>
                                <p className="text-gray-900">{order.shipping.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Delivery Information */}
                      {order.delivery?.deliveredAt && (
                        <Card className="bg-green-50 border-green-200">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-900">
                              <Package className="w-4 h-4" />
                              Delivery Information
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-green-700">Delivered At</span>
                              <span className="font-medium text-green-900">
                                {new Date(order.delivery.deliveredAt).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                            {order.delivery.notes && (
                              <div className="pt-2 border-t border-green-200">
                                <span className="text-green-700 block mb-1">Delivery Notes</span>
                                <p className="text-green-900">{order.delivery.notes}</p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Order Activity Timeline */}
                      <Card className="bg-gray-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Order Activity Timeline
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {/* Order Created */}
                            <div className="flex gap-3">
                              <div className="flex flex-col items-center">
                                <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                                <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                              </div>
                              <div className="flex-1 pb-3">
                                <p className="text-sm font-medium text-gray-900">Order Created</p>
                                <p className="text-xs text-gray-600">
                                  {new Date(order.createdAt).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                            </div>

                            {/* Order Confirmed */}
                            {order.confirmedAt && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                                  <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-gray-900">Order Confirmed</p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(order.confirmedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Processing */}
                            {order.processing?.startedAt && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5"></div>
                                  <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-gray-900">Processing Started</p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(order.processing.startedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {order.processing.notes && (
                                    <p className="text-xs text-gray-700 mt-1 bg-white p-2 rounded border border-gray-200">
                                      {order.processing.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Shipped */}
                            {order.shipping?.shippedAt && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                                  <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-gray-900">Order Shipped</p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(order.shipping.shippedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {order.shipping.trackingNumber && (
                                    <p className="text-xs text-gray-700 mt-1">
                                      Tracking: <span className="font-mono font-medium">{order.shipping.trackingNumber}</span>
                                    </p>
                                  )}
                                  {order.shipping.notes && (
                                    <p className="text-xs text-gray-700 mt-1 bg-white p-2 rounded border border-gray-200">
                                      {order.shipping.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Delivered */}
                            {order.delivery?.deliveredAt && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                                  {(order.return?.requestedAt || order.refunds?.length) && (
                                    <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-gray-900">Order Delivered</p>
                                  <p className="text-xs text-gray-600">
                                    {new Date(order.delivery.deliveredAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {order.delivery.notes && (
                                    <p className="text-xs text-gray-700 mt-1 bg-white p-2 rounded border border-gray-200">
                                      {order.delivery.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Cancelled */}
                            {order.cancellation?.cancelledAt && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                                  {order.refunds?.length && (
                                    <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-red-900">Order Cancelled</p>
                                  <p className="text-xs text-red-700">
                                    {new Date(order.cancellation.cancelledAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {order.cancellation.reason && (
                                    <p className="text-xs text-red-800 mt-1 bg-red-50 p-2 rounded border border-red-200">
                                      Reason: {order.cancellation.reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Return Requested */}
                            {order.return?.requestedAt && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5"></div>
                                  {(order.return.approvedAt || order.return.rejectedAt || order.refunds?.length) && (
                                    <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-blue-900">Return Requested</p>
                                  <p className="text-xs text-blue-700">
                                    {new Date(order.return.requestedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {order.return.reason && (
                                    <p className="text-xs text-blue-800 mt-1 bg-blue-50 p-2 rounded border border-blue-200">
                                      Reason: {order.return.reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Return Approved */}
                            {order.return?.approvedAt && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                                  {order.refunds?.length && (
                                    <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-green-900">Return Approved</p>
                                  <p className="text-xs text-green-700">
                                    {new Date(order.return.approvedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {order.return.notes && (
                                    <p className="text-xs text-green-800 mt-1 bg-green-50 p-2 rounded border border-green-200">
                                      {order.return.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Return Rejected */}
                            {order.return?.rejectedAt && (
                              <div className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div>
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-red-900">Return Rejected</p>
                                  <p className="text-xs text-red-700">
                                    {new Date(order.return.rejectedAt).toLocaleDateString('en-US', {
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  {order.return.notes && (
                                    <p className="text-xs text-red-800 mt-1 bg-red-50 p-2 rounded border border-red-200">
                                      {order.return.notes}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Refunds */}
                            {order.refunds && order.refunds.length > 0 && order.refunds.map((refund, idx) => (
                              <div key={idx} className="flex gap-3">
                                <div className="flex flex-col items-center">
                                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5"></div>
                                  {idx < order.refunds!.length - 1 && (
                                    <div className="w-0.5 h-full bg-gray-300 mt-1"></div>
                                  )}
                                </div>
                                <div className="flex-1 pb-3">
                                  <p className="text-sm font-medium text-green-900">
                                    Refund Processed: ${refund.amount.toFixed(2)}
                                  </p>
                                  {refund.processedAt && (
                                    <p className="text-xs text-green-700">
                                      {new Date(refund.processedAt).toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  )}
                                  <Badge variant="outline" className="border-green-500 text-green-700 text-xs mt-1">
                                    {refund.status.toUpperCase()}
                                  </Badge>
                                  {refund.reason && (
                                    <p className="text-xs text-green-800 mt-1 bg-green-50 p-2 rounded border border-green-200">
                                      Reason: {refund.reason}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Price Breakdown */}
                      <Card className="bg-gray-50">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm font-medium">Price Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Subtotal</span>
                            <span>${order.subtotal?.toFixed(2)}</span>
                          </div>
                          {order.discount && order.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Product Discount</span>
                              <span>-${order.discount.toFixed(2)}</span>
                            </div>
                          )}
                          {order.coupon?.discount && order.coupon.discount > 0 && (
                            <div className="flex justify-between text-green-600">
                              <span>Coupon ({order.coupon.code})</span>
                              <span>-${order.coupon.discount.toFixed(2)}</span>
                            </div>
                          )}
                          {order.shippingCharges !== undefined && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Shipping</span>
                              <span>
                                {order.shippingCharges === 0 ? 'FREE' : `$${order.shippingCharges.toFixed(2)}`}
                              </span>
                            </div>
                          )}
                          <div className="flex justify-between pt-2 border-t font-semibold text-base">
                            <span>Total</span>
                            <span>${order.total?.toFixed(2)}</span>
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>

                  {/* Return Window Info */}
                  {order.status.toLowerCase() === 'delivered' && returnWindowInfo && returnWindowInfo.daysRemaining > 0 && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900">
                          Return window: {returnWindowInfo.daysRemaining} day{returnWindowInfo.daysRemaining !== 1 ? 's' : ''} remaining
                        </p>
                        <p className="text-xs text-blue-700 mt-1">
                          You can return eligible items within {returnWindowInfo.maxReturnWindow} days of delivery.
                          {returnableItems.length < order.items.length && (
                            <span className="block mt-1">
                              Note: Some items in this order are non-returnable or have expired return windows.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Refund Information */}
                  {order.status.toLowerCase() === 'cancelled' && order.refunds && order.refunds.length > 0 && (
                    <Card className="bg-yellow-50 border-yellow-200">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-yellow-900">Refund Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {order.refunds.map((refund, idx) => (
                          <div key={idx} className="flex justify-between items-center text-sm">
                            <div>
                              <p className="font-medium text-yellow-900">${refund.amount.toFixed(2)}</p>
                              <p className="text-xs text-yellow-700">
                                Status: {refund.status.toUpperCase()}
                              </p>
                            </div>
                            {refund.processedAt && (
                              <p className="text-xs text-yellow-700">
                                {new Date(refund.processedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t">
                    {(() => {
                      const canCancel = canCancelOrder(order);
                      const canReturn = canRequestReturn(order);
                      console.log(`🎯 Button visibility for ${order.orderNumber}:`, {
                        canCancel,
                        canReturn,
                        returnableItemsCount: returnableItems.length
                      });
                      return null;
                    })()}

                    {canCancelOrder(order) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCancelOrderDialog({ open: true, orderId: order._id })}
                        className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        Cancel Order
                      </Button>
                    )}
                    {canRequestReturn(order) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setReturnOrderDialog({ open: true, orderId: order._id })}
                        className="gap-2 text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <RotateCcw className="w-4 h-4" />
                        Request Return
                        {returnableItems.length > 0 && ` (${returnableItems.length} item${returnableItems.length !== 1 ? 's' : ''})`}
                      </Button>
                    )}
                    {order.return?.status === 'requested' && (
                      <>
                        <Badge variant="outline" className="border-blue-500 text-blue-700">
                          Return request pending review
                        </Badge>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCancelReturnDialog({ open: true, orderId: order._id })}
                          className="gap-2 text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                          Cancel Return Request
                        </Button>
                      </>
                    )}
                    {order.return?.status === 'approved' && (
                      <Badge className="bg-green-500 text-white">
                        Return approved - Refund processing
                      </Badge>
                    )}
                    {order.return?.status === 'rejected' && (
                      <Badge variant="outline" className="border-red-500 text-red-700">
                        Return request rejected
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cancel Order Dialog */}
      <Dialog open={cancelOrderDialog.open} onOpenChange={(open) => setCancelOrderDialog({ open, orderId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Reason (Optional)</label>
              <Textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Please provide a reason for cancellation..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCancelOrderDialog({ open: false, orderId: null });
                setCancelReason('');
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCancelOrder}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Return Dialog */}
      <Dialog open={returnOrderDialog.open} onOpenChange={(open) => setReturnOrderDialog({ open, orderId: null })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request Return</DialogTitle>
            <DialogDescription>
              Please provide a reason for your return request. Our team will review it shortly.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Show returnable items */}
            {returnOrderDialog.orderId && (() => {
              const order = orders.find(o => o._id === returnOrderDialog.orderId);
              const returnableItems = order ? getReturnableItems(order) : [];

              return returnableItems.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                    <Package className="w-4 h-4" />
                    <span>Returnable Items ({returnableItems.length})</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {returnableItems.map((item, idx) => (
                      <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="relative w-16 h-16 flex-shrink-0 bg-white rounded overflow-hidden">
                          {item.product?.images?.[0]?.url ? (
                            <Image
                              src={item.product.images[0].url}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          <Badge variant="outline" className="border-green-500 text-green-700 text-xs mt-1">
                            {item.product?.returnPolicy?.returnWindowDays || 7} days return window
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                  {order && order.items.length > returnableItems.length && (
                    <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-yellow-800">
                        {order.items.length - returnableItems.length} item(s) cannot be returned (non-returnable or return window expired)
                      </p>
                    </div>
                  )}
                </div>
              );
            })()}

            <div>
              <label className="text-sm font-medium mb-2 block">Return Reason *</label>
              <Textarea
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="Please describe why you want to return these items..."
                rows={4}
                required
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Please provide a detailed reason to help us process your return request faster.
              </p>
            </div>

            {/* Bank Details for COD Orders */}
            {returnOrderDialog.orderId && (() => {
              const order = orders.find(o => o._id === returnOrderDialog.orderId);
              const isCOD = order?.payment?.method === 'cod';

              return isCOD && (
                <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-blue-900">Bank Details for Refund</h3>
                  </div>
                  <p className="text-xs text-blue-700">
                    Since this is a COD order, please provide your US bank account details to receive the refund via ACH transfer.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-medium mb-1 block text-gray-700">Account Holder Name *</label>
                      <Input
                        value={bankDetails.accountHolderName}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountHolderName: e.target.value })}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium mb-1 block text-gray-700">Account Number *</label>
                      <Input
                        value={bankDetails.accountNumber}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                        placeholder="123456789012"
                        type="text"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium mb-1 block text-gray-700">Routing Number (ABA) *</label>
                      <Input
                        value={bankDetails.routingNumber}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 9);
                          setBankDetails({ ...bankDetails, routingNumber: value });
                        }}
                        placeholder="123456789"
                        maxLength={9}
                        type="text"
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">9-digit routing number</p>
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium mb-1 block text-gray-700">Bank Name *</label>
                      <Input
                        value={bankDetails.bankName}
                        onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                        placeholder="Bank of America"
                        required
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <label className="text-xs font-medium mb-1 block text-gray-700">Account Type *</label>
                      <select
                        value={bankDetails.accountType}
                        onChange={(e) => setBankDetails({ ...bankDetails, accountType: e.target.value as 'checking' | 'savings' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="checking">Checking Account</option>
                        <option value="savings">Savings Account</option>
                      </select>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReturnOrderDialog({ open: false, orderId: null });
                setReturnReason('');
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRequestReturn}
              disabled={isSaving || !returnReason.trim()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Submitting...
                </span>
              ) : (
                'Submit Return Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Return Request Dialog */}
      <Dialog open={cancelReturnDialog.open} onOpenChange={(open) => setCancelReturnDialog({ open, orderId: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Return Request</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel your return request? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-900">Important</p>
                <p className="text-xs text-yellow-700 mt-1">
                  Once cancelled, you'll need to submit a new return request if you change your mind.
                  The return window may expire during this time.
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelReturnDialog({ open: false, orderId: null })}
              disabled={isSaving}
            >
              Keep Return Request
            </Button>
            <Button
              onClick={handleCancelReturnRequest}
              disabled={isSaving}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Cancelling...
                </span>
              ) : (
                'Cancel Return Request'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.open} onOpenChange={(open) => {
        if (!open) {
          setReviewDialog({ open: false, orderId: null, productId: null, productTitle: '' });
          setReviewRating(0);
          setReviewComment('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {reviewDialog.productTitle}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Star Rating */}
            <div>
              <label className="text-sm font-medium mb-2 block">Rating *</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-8 h-8 ${star <= reviewRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                        }`}
                    />
                  </button>
                ))}
              </div>
              {reviewRating > 0 && (
                <p className="text-xs text-gray-600 mt-1">
                  {reviewRating === 1 && 'Poor'}
                  {reviewRating === 2 && 'Fair'}
                  {reviewRating === 3 && 'Good'}
                  {reviewRating === 4 && 'Very Good'}
                  {reviewRating === 5 && 'Excellent'}
                </p>
              )}
            </div>

            {/* Review Comment */}
            <div>
              <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
              <Textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Tell us what you think about this product..."
                rows={4}
                maxLength={1000}
                className="resize-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                {reviewComment.length}/1000 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setReviewDialog({ open: false, orderId: null, productId: null, productTitle: '' });
                setReviewRating(0);
                setReviewComment('');
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={isSaving || reviewRating === 0}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <Spinner className="w-4 h-4" />
                  Submitting...
                </span>
              ) : (
                'Submit Review'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
