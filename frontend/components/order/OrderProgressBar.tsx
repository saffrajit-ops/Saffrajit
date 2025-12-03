'use client';

import { motion } from 'framer-motion';
import { Check, Package, Truck, Home, XCircle, RotateCcw } from 'lucide-react';

interface OrderProgressBarProps {
  status: string;
  confirmedAt?: string;
  processing?: { startedAt?: string };
  shipping?: { shippedAt?: string };
  delivery?: { deliveredAt?: string };
  cancellation?: { cancelledAt?: string };
  return?: { requestedAt?: string; status?: string };
  refunds?: Array<{
    amount: number;
    status?: string;
    processedAt?: string;
  }>;
}

export default function OrderProgressBar({
  status,
  confirmedAt,
  processing,
  shipping,
  delivery,
  cancellation,
  return: returnInfo,
  refunds,
}: OrderProgressBarProps) {
  const normalizedStatus = status.toLowerCase();

  // Define order stages
  const stages = [
    { key: 'confirmed', label: 'Confirmed', icon: Check, date: confirmedAt },
    { key: 'processing', label: 'Processing', icon: Package, date: processing?.startedAt },
    { key: 'shipped', label: 'Shipped', icon: Truck, date: shipping?.shippedAt },
    { key: 'delivered', label: 'Delivered', icon: Home, date: delivery?.deliveredAt },
  ];

  // Handle special statuses
  if (normalizedStatus === 'cancelled' || normalizedStatus === 'refunded') {
    // Check if refund is completed - if so, just show a simple message
    const hasRefunds = refunds && refunds.length > 0;
    const hasCompletedRefund = hasRefunds && refunds.some(r => r.status === 'completed');
    
    // Check if this was a return (not a cancellation)
    const isReturn = returnInfo && (returnInfo.status === 'approved' || returnInfo.status === 'completed');
    
    // If refund is completed, don't show progress bar
    if (hasCompletedRefund || normalizedStatus === 'refunded') {
      return (
        <div className={`w-full py-4 ${isReturn ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'} border rounded-lg p-4`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full ${isReturn ? 'bg-orange-500' : 'bg-red-500'} flex items-center justify-center`}>
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${isReturn ? 'text-orange-900' : 'text-red-900'}`}>
                {isReturn ? 'Order Returned & Refunded' : 'Order Cancelled & Refunded'}
              </p>
              <p className={`text-xs ${isReturn ? 'text-orange-600' : 'text-red-600'} mt-0.5`}>
                Your refund has been processed successfully
              </p>
            </div>
            {(cancellation?.cancelledAt || returnInfo?.requestedAt) && (
              <p className={`text-xs ${isReturn ? 'text-orange-600' : 'text-red-600'}`}>
                {new Date((isReturn ? returnInfo?.requestedAt : cancellation?.cancelledAt) || '').toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      );
    }

    // Show refund progress only if refund is pending
    const refundStages = [
      { key: 'cancelled', label: 'Cancelled', completed: true },
      { key: 'processing', label: 'Processing Refund', completed: hasRefunds },
      { key: 'refunded', label: 'Refunded', completed: hasCompletedRefund },
    ];

    const currentRefundStage = refundStages.findIndex(s => !s.completed);
    const progress = currentRefundStage === -1 ? 100 : (currentRefundStage / (refundStages.length - 1)) * 100;

    return (
      <div className="w-full py-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <XCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm font-medium text-red-900">Order Cancelled - Processing Refund</p>
          {cancellation?.cancelledAt && (
            <p className="text-xs text-red-600 ml-auto">
              {new Date(cancellation.cancelledAt).toLocaleDateString()}
            </p>
          )}
        </div>

        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-red-200">
            <motion.div
              className="h-full bg-red-500"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="relative flex justify-between">
            {refundStages.map((stage, index) => (
              <div key={stage.key} className="flex flex-col items-center" style={{ width: '33.33%' }}>
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${stage.completed ? 'bg-red-500 border-red-500' : 'bg-white border-red-300'
                    }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {stage.completed ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-red-300" />
                  )}
                </motion.div>
                <p className={`text-xs mt-2 text-center ${stage.completed ? 'text-red-900 font-medium' : 'text-red-600'}`}>
                  {stage.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (normalizedStatus === 'returned' || returnInfo?.status) {
    // Handle rejected returns differently
    if (returnInfo?.status === 'rejected') {
      return (
        <div className="w-full py-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-4">
            <XCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm font-medium text-red-900">Return Rejected</p>
            {returnInfo?.requestedAt && (
              <p className="text-xs text-red-600 ml-auto">
                {new Date(returnInfo.requestedAt).toLocaleDateString()}
              </p>
            )}
          </div>
          <div className="bg-white border border-red-200 rounded p-3">
            <p className="text-xs text-red-800">
              Your return request has been rejected. The order cannot be returned. If you have questions, please contact customer support.
            </p>
          </div>
        </div>
      );
    }

    // Return progress stages for approved/completed returns
    const returnStages = [
      { key: 'requested', label: 'Requested', completed: !!returnInfo?.requestedAt },
      { key: 'approved', label: 'Approved', completed: returnInfo?.status === 'approved' || returnInfo?.status === 'completed' },
      { key: 'processing', label: 'Processing', completed: returnInfo?.status === 'completed' },
      { key: 'refunded', label: 'Refunded', completed: returnInfo?.status === 'completed' },
    ];

    const currentReturnStage = returnStages.findIndex(s => !s.completed);
    const progress = currentReturnStage === -1 ? 100 : (currentReturnStage / (returnStages.length - 1)) * 100;

    return (
      <div className="w-full py-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-orange-600" />
          <p className="text-sm font-medium text-orange-900">
            Return {returnInfo?.status ? returnInfo.status.charAt(0).toUpperCase() + returnInfo.status.slice(1) : 'Requested'}
          </p>
        </div>

        <div className="relative">
          <div className="absolute top-5 left-0 right-0 h-0.5 bg-orange-200">
            <motion.div
              className="h-full bg-orange-500"
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <div className="relative flex justify-between">
            {returnStages.map((stage, index) => (
              <div key={stage.key} className="flex flex-col items-center" style={{ width: '25%' }}>
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${stage.completed ? 'bg-orange-500 border-orange-500' : 'bg-white border-orange-300'
                    }`}
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {stage.completed ? (
                    <Check className="w-5 h-5 text-white" />
                  ) : (
                    <div className="w-3 h-3 rounded-full bg-orange-300" />
                  )}
                </motion.div>
                <p className={`text-xs mt-2 text-center ${stage.completed ? 'text-orange-900 font-medium' : 'text-orange-600'}`}>
                  {stage.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (normalizedStatus === 'failed') {
    return (
      <div className="flex items-center justify-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <XCircle className="w-5 h-5 text-red-600" />
        <div>
          <p className="text-sm font-medium text-red-900">Payment Failed</p>
          <p className="text-xs text-red-600">Please try again or contact support</p>
        </div>
      </div>
    );
  }

  // Determine current stage index
  const getCurrentStageIndex = () => {
    if (normalizedStatus === 'delivered') return 3;
    if (normalizedStatus === 'shipped') return 2;
    if (normalizedStatus === 'processing') return 1;
    if (normalizedStatus === 'confirmed' || normalizedStatus === 'pending') return 0;
    return 0;
  };

  const currentStageIndex = getCurrentStageIndex();

  return (
    <div className="w-full py-6">
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200">
          <motion.div
            className="h-full bg-green-500"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Stages */}
        <div className="relative flex justify-between">
          {stages.map((stage, index) => {
            const isCompleted = index <= currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.key} className="flex flex-col items-center" style={{ width: '25%' }}>
                {/* Icon Circle */}
                <motion.div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${isCompleted
                    ? 'bg-green-500 border-green-500'
                    : 'bg-white border-gray-300'
                    }`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Icon
                    className={`w-5 h-5 ${isCompleted ? 'text-white' : 'text-gray-400'
                      }`}
                    strokeWidth={2}
                  />
                </motion.div>

                {/* Label */}
                <div className="mt-2 text-center">
                  <p
                    className={`text-xs font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'
                      }`}
                  >
                    {stage.label}
                  </p>
                  {stage.date && isCompleted && (
                    <p className="text-[10px] text-gray-500 mt-0.5">
                      {new Date(stage.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>

                {/* Pulse animation for current stage */}
                {isCurrent && (
                  <motion.div
                    className="absolute w-10 h-10 rounded-full bg-green-500 opacity-20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0, 0.2] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
