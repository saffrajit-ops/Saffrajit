'use client';

import { motion } from 'framer-motion';
import { MapPin, Truck, Package } from 'lucide-react';
import { OrderAddress } from '@/lib/order-store';
import { Skeleton } from '@/components/ui/skeleton';

interface ShippingInfoProps {
  address: OrderAddress;
  orderStatus: string;
  trackingNumber?: string;
  isLoading?: boolean;
}

export default function ShippingInfo({
  address,
  orderStatus,
  trackingNumber,
  isLoading = false
}: ShippingInfoProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Package className="w-5 h-5" strokeWidth={1.5} />;
      case 'confirmed':
        return <Package className="w-5 h-5" strokeWidth={1.5} />;
      case 'processing':
        return <Package className="w-5 h-5" strokeWidth={1.5} />;
      case 'shipped':
        return <Truck className="w-5 h-5" strokeWidth={1.5} />;
      case 'delivered':
        return <Truck className="w-5 h-5" strokeWidth={1.5} />;
      default:
        return <Package className="w-5 h-5" strokeWidth={1.5} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'confirmed':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'processing':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'shipped':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'delivered':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Shipping Address */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          <h3 className="text-base tracking-wider font-medium text-gray-900">
            SHIPPING ADDRESS
          </h3>
        </div>

        <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
          <p className="text-sm font-medium text-gray-900 mb-2">
            {address.label}
          </p>
          <div className="text-sm text-gray-700 space-y-1 font-light">
            <p>{address.line1}</p>
            {address.line2 && <p>{address.line2}</p>}
            <p>
              {address.city}, {address.state} {address.zip}
            </p>
            <p>{address.country}</p>
          </div>
        </div>
      </motion.section>

      {/* Order Status */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center gap-2 mb-4">
          <Package className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
          <h3 className="text-base tracking-wider font-medium text-gray-900">
            ORDER STATUS
          </h3>
        </div>

        <div className={`p-4 border rounded-lg flex items-center gap-3 ${getStatusColor(orderStatus)}`}>
          {getStatusIcon(orderStatus)}
          <div>
            <p className="text-sm font-medium capitalize">
              {orderStatus.replace(/([A-Z])/g, ' $1').trim()}
            </p>
            {orderStatus === 'pending' && (
              <p className="text-xs mt-1 font-light">
                Your order is being prepared for shipment
              </p>
            )}
            {orderStatus === 'confirmed' && (
              <p className="text-xs mt-1 font-light">
                Your order has been confirmed
              </p>
            )}
            {orderStatus === 'processing' && (
              <p className="text-xs mt-1 font-light">
                Your order is being prepared for shipment
              </p>
            )}
            {orderStatus === 'shipped' && (
              <p className="text-xs mt-1 font-light">
                Your order is on the way
              </p>
            )}
            {orderStatus === 'delivered' && (
              <p className="text-xs mt-1 font-light">
                Your order has been delivered
              </p>
            )}
          </div>
        </div>
      </motion.section>

      {/* Tracking Information */}
      {trackingNumber && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-5 h-5 text-gray-900" strokeWidth={1.5} />
            <h3 className="text-base tracking-wider font-medium text-gray-900">
              TRACKING NUMBER
            </h3>
          </div>

          <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
            <p className="text-sm font-mono text-gray-900 break-all">
              {trackingNumber}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Track your shipment using this number
            </p>
          </div>
        </motion.section>
      )}
    </div>
  );
}
